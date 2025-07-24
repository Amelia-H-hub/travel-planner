from sqlalchemy import Column, Integer, String, Numeric
from .database import Base

class City(Base):
  __tablename__ = "cities"

  id = Column(Integer, primary_key=True, index=True, autoincrement=True)
  # autoincrement=True is default when the column is Integer and primary_key=True
  name = Column(String, index=True)
  country_code = Column(String, index=True)
  country_name = Column(String, index=True)
  admin1_code = Column(String, index=True)
  admin1_name = Column(String, index=True)
  timezone = Column(String, index=True)
  timezone_offset = Column(String, index=True)
  latitude = Column(Numeric(10, 5), index=True)
  longitude = Column(Numeric(10, 5), index=True)