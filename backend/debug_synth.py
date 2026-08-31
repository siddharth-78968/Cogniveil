import traceback
import mcp_tools

try:
    res = mcp_tools.synthesize_evidence(
        patient_name='Alpha',
        age=68,
        tier1_summary={'score': 83.4, 'risk_level': 'Low'},
        longitudinal_summary={'is_deviating': False, 'days_with_decline': 0, 'current_score': 83.4},
        tier2_result={'risk_level': 'Low', 'shap_features': []}
    )
    print('Type of res:', type(res))
    if res:
        print('Keys:', list(res.keys()))
except Exception as e:
    traceback.print_exc()
