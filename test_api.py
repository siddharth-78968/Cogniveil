import requests
import json

print("--------------------------------------------------")
print("CogniVeil — MedGemma & MCP Tool API Health Check")
print("--------------------------------------------------\n")

# 1. Login to get JWT Token
login_res = requests.post(
    "http://localhost:8000/login",
    json={"email": "rajan@demo.com", "password": "demo1234"}
)

if login_res.status_code != 200:
    print("❌ Login failed. Ensure backend server is running on http://localhost:8000")
    exit(1)

token = login_res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Call MedGemma Clinical Report Endpoint
report_res = requests.post(
    "http://localhost:8000/api/clinical-report",
    json={
        "cogni_score": 32.5,
        "risk_level": "High",
        "is_deviating": True,
        "patient_name": "Rajan Pillai",
        "age": 78
    },
    headers=headers
)

print(f"Status Code: {report_res.status_code}")
print("Response Output:\n")
print(json.dumps(report_res.json(), indent=2))
print("\n--------------------------------------------------")
