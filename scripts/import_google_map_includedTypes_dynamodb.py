import csv
import boto3
from decimal import Decimal
import math

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
table = dynamodb.Table("google_map_includedTypes")

# Convert empty string to None, convert booleans, and convert number string to Decimal
def convert_value(value):
  # string
  if value == "":
    return None
  
  # boolean
  if isinstance(value, str):
    val_lower = value.strip().lower()
    if val_lower in ["true"]:
      return True
    elif val_lower in ["false"]:
      return False
  
  # number
  try:
    num = float(value)
    if math.isnan(num) or math.isinf(num):
      return None
    return Decimal(str(num))
  except ValueError:
    return value

# Import data from CSV file to DynamoDB
def import_file(file_path):
  with open(file_path, newline="", encoding="utf-8-sig") as csvfile:
    reader = csv.DictReader(csvfile)
    with table.batch_writer() as batch:
      for row in reader:
        item = {}
        for k, v in row.items():
          item[k] = convert_value(v)
        item["main_category"] = str(item["main_category"])
        item["sub_type"] = str(item["sub_type"])
        batch.put_item(Item=item)
    
if __name__ == "__main__":
  import_file('src/assets/google_map_includedTypes.csv')
  print("Data imported.")