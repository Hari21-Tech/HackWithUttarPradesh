from motor.motor_asyncio import AsyncIOMotorClient
from os import getenv
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = getenv("MONGO_URI", "mongodb+srv://jsrihariseshbe24:OkxQQv04JIEoarF6@obscura.uhjj2ie.mongodb.net/OBSCURA?retryWrites=true&w=majority")
DB_NAME = getenv("DB_NAME", "HackWithUttarPradesh")


client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]


clients_col = db["clients_col"]
users_col = db["users"]
fair_collection = db["FAIR Calc"]