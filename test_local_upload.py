import requests
import json
import base64

# Create a small dummy image for testing
img_data = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==")

files = {"file": ("test_dot.png", img_data, "image/png")}
data = {"alt": "test image"}
try:
    resp = requests.post("http://127.0.0.1:5001/api/admin/uploads", files=files, data=data)
    print("Status:", resp.status_code)
    print("Response:", resp.text)
except Exception as e:
    print(e)
