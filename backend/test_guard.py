import mcp_tools
import mcp_server
import json

print("=== TESTING MCP STANDALONE GUARDS ===")

# Test 1: Predict Risk Standalone
res_pred_standalone = mcp_tools.predict_risk({"Age": 70})
print("10_predict_risk (Standalone):", res_pred_standalone)
assert res_pred_standalone.get("status") == "rejected_unorchestrated_execution"

# Test 2: Classify MRI Standalone
res_mri_standalone = mcp_tools.classify_mri()
print("11_classify_mri (Standalone):", res_mri_standalone)
assert res_mri_standalone.get("status") == "rejected_unorchestrated_execution"

# Test 3: Draft Report Standalone
res_rep_standalone = mcp_tools.draft_report("Patient", 70, 50.0, "Moderate", False)
print("15_draft_report (Standalone):", res_rep_standalone)
assert isinstance(res_rep_standalone, dict) and res_rep_standalone.get("status") == "rejected_unorchestrated_execution"

# Test 4: Generate Referral Standalone
res_ref_standalone = mcp_tools.generate_referral("Moderate")
print("17_generate_referral (Standalone):", res_ref_standalone)
assert res_ref_standalone.get("status") == "rejected_unorchestrated_execution"

# Test 5: MCP Server JSON-RPC Call Standalone
req_unauth = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
        "name": "10_predict_risk",
        "arguments": {"patient_data": {"Age": 70}}
    }
}
resp_unauth = mcp_server.handle_request(req_unauth)
content_text = json.loads(resp_unauth["result"]["content"][0]["text"])
print("MCP Server JSON-RPC (Standalone):", content_text)
assert content_text.get("status") == "rejected_unorchestrated_execution"

# Test 6: MCP Server JSON-RPC Call with Active Orchestration Session
sample_data = {
    'Country': 'India', 'Age': 70, 'Gender': 'Male', 'Education Level': 'Higher', 'BMI': 23.0,
    'Physical Activity Level': 'Medium', 'Smoking Status': 'Never', 'Alcohol Consumption': 'Never',
    'Diabetes': 'No', 'Hypertension': 'No', 'Cholesterol Level': 'Normal',
    "Family History of Alzheimer's": 'No', 'Cognitive Test Score': 80.0,
    'Depression Level': 'Low', 'Sleep Quality': 'Good', 'Dietary Habits': 'Balanced',
    'Air Pollution Exposure': 'Low', 'Employment Status': 'Employed', 'Marital Status': 'Married',
    'Genetic Risk Factor (APOE-4 allele)': 'No', 'Social Engagement Level': 'High',
    'Income Level': 'Middle', 'Stress Levels': 'Low', 'Urban vs Rural Living': 'Urban'
}
req_auth = {
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
        "name": "10_predict_risk",
        "arguments": {
            "patient_data": sample_data,
            "session_id": "S_patient_42"
        }
    }
}
resp_auth = mcp_server.handle_request(req_auth)
content_auth = json.loads(resp_auth["result"]["content"][0]["text"])
print("MCP Server JSON-RPC (Orchestrated):", content_auth.get("status"), "Probability:", content_auth.get("probability"))
assert content_auth.get("status") == "success"

print("\n>>> ALL MCP ORCHESTRATOR GUARDS VERIFIED SUCCESSFULLY! <<<")
