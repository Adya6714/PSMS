# app.py

import os
from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from dotenv import load_dotenv
import pandas as pd
from bson.objectid import ObjectId
import math
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config["MONGO_URI"] = os.getenv("MONGO_URI")
mongo = PyMongo(app)
db = mongo.db

ALLOWED_EXTENSIONS = {"xlsx", "xls"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/upload", methods=["POST"])
def upload_files():
    if "companies_details" not in request.files or "stipend_details" not in request.files:
        return jsonify({"error": "Both files (companies_details, stipend_details) are required."}), 400

    comp_file = request.files["companies_details"]
    stipend_file = request.files["stipend_details"]

    if not (allowed_file(comp_file.filename) and allowed_file(stipend_file.filename)):
        return jsonify({"error": "Only Excel files are allowed."}), 400

    try:
        df_companies = pd.read_excel(comp_file, engine="openpyxl")
        df_stipend = pd.read_excel(stipend_file, engine="openpyxl")
    except Exception as e:
        return jsonify({"error": f"Error reading Excel files: {str(e)}"}), 500

    required_cols_comp = {"COMPANY", "PROJECT", "LOCATION", "Business Domain", "Tags"}
    if not required_cols_comp.issubset(df_companies.columns):
        return jsonify({"error": f"companies_details.xlsx must contain columns: {required_cols_comp}"}), 400

    required_cols_stipend = {"COMPANY", "STIPEND"}
    if not required_cols_stipend.issubset(df_stipend.columns):
        return jsonify({"error": f"stipend_details.xlsx must contain columns: {required_cols_stipend}"}), 400

    df_merged = pd.merge(df_companies, df_stipend, on="COMPANY", how="left")
    df_merged["STIPEND"] = df_merged["STIPEND"].fillna(0)

    print("✅ Total companies in Excel:", df_merged["COMPANY"].nunique())
    print("⚠️ Rows with null company name:", df_merged["COMPANY"].isna().sum())

    company_docs = []
    for company_name, group in df_merged.groupby("COMPANY"):
        if not company_name or pd.isna(company_name):
            continue  # skip invalid names

        first_row = group.iloc[0]
        location = first_row["LOCATION"]
        business_domain = first_row["Business Domain"]
        raw_tags = str(first_row["Tags"])
        tags = [tag.strip() for tag in raw_tags.split(",")] if raw_tags else []

        stipend_value = float(first_row["STIPEND"])
        project_names = group["PROJECT"].dropna().unique().tolist()
        projects_list = [{"name": name, "rating": None} for name in project_names]

        doc = {
            "company": company_name,
            "location": location,
            "business_domain": business_domain,
            "tags": tags,
            "stipend": stipend_value,
            "projects": projects_list,
            "rating_company_overall": None,
            "rating_location": None,
            "rating_stipend": None,
            "reached_linkedin": False,
            "remarks": ""
        }
        company_docs.append(doc)

    db.companies.delete_many({})
    if company_docs:
        db.companies.insert_many(company_docs)

    return jsonify({
        "message": f"Imported {len(company_docs)} companies.",
        "total_uploaded_from_excel": df_merged["COMPANY"].nunique()
    }), 200


@app.route("/companies", methods=["GET"])
def get_all_companies():
    try:
        cursor = db.companies.find({}, {"company": 1})
        companies = [doc["company"] for doc in cursor]
        return jsonify({"companies": companies}), 200
    except Exception as e:
        print("❌ /companies failed:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/company/<string:company_name>", methods=["GET"])
def get_company_details(company_name):
    doc = db.companies.find_one({"company": company_name})
    if not doc:
        return jsonify({"error": "Company not found."}), 404
    doc["_id"] = str(doc["_id"])
    return jsonify({"company": doc}), 200


@app.route("/company/<string:company_name>/update", methods=["POST"])
def update_company(company_name):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON payload provided."}), 400

    update_fields = {}
    for key in ["rating_company_overall", "rating_location", "rating_stipend", "reached_linkedin", "remarks"]:
        if key in data:
            update_fields[key] = data[key]

    if "project_ratings" in data:
        existing_doc = db.companies.find_one({"company": company_name}, {"projects": 1})
        if not existing_doc:
            return jsonify({"error": "Company not found."}), 404

        existing_projects = existing_doc.get("projects", [])
        updated_projects = []
        for proj in existing_projects:
            name = proj["name"]
            rating_entry = next((x for x in data["project_ratings"] if x["name"] == name), None)
            if rating_entry:
                updated_projects.append({"name": name, "rating": rating_entry["rating"]})
            else:
                updated_projects.append(proj)
        update_fields["projects"] = updated_projects

    if not update_fields:
        return jsonify({"error": "No valid fields to update."}), 400

    result = db.companies.update_one({"company": company_name}, {"$set": update_fields})
    if result.matched_count == 0:
        return jsonify({"error": "Company not found."}), 404

    return jsonify({"message": "Company updated."}), 200


@app.route("/ranking", methods=["GET"])
def get_ranking():
    all_docs = list(db.companies.find({}))

    ranking_list = []
    for doc in all_docs:
        ratings_to_avg = []
        for field in ["rating_company_overall", "rating_location", "rating_stipend"]:
            val = doc.get(field)
            if isinstance(val, (int, float)):
                ratings_to_avg.append(val)

        proj_ratings = [p.get("rating") for p in doc.get("projects", []) if isinstance(p.get("rating"), (int, float))]
        if proj_ratings:
            ratings_to_avg.append(sum(proj_ratings) / len(proj_ratings))

        if ratings_to_avg:
            avg_score = sum(ratings_to_avg) / len(ratings_to_avg)
        else:
            avg_score = 0.0

        ranking_list.append({
            "company": doc.get("company"),
            "location": doc.get("location"),
            "stipend": doc.get("stipend"),
            "average_score": round(avg_score, 2)
        })

    ranking_list.sort(key=lambda x: x["average_score"], reverse=True)
    return jsonify({"ranking": ranking_list}), 200


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)