import boto3
import os
from dotenv import load_dotenv
from botocore.config import Config

load_dotenv()

s3 = boto3.client(
    's3',
    endpoint_url=os.getenv('R2_ENDPOINT_URL'),
    aws_access_key_id=os.getenv('R2_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('R2_SECRET_ACCESS_KEY'),
    region_name='weur', # Try something other than auto, or auto
    config=Config(signature_version='s3v4')
)

try:
    response = s3.list_objects_v2(Bucket=os.getenv('R2_BUCKET'))
    print("List objects successful! Objects:")
    for obj in response.get('Contents', []):
        print(f" - {obj['Key']}")
except Exception as e:
    print(f"List failed: {e}")
