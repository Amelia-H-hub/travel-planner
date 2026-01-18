import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom";
import { API_BASE_URL } from '@/constants';

export default function CitiesRecommendation() {

  const location = useLocation();
  const inputData = location.state || {};

  useEffect(() => {
    console.log("Input Data Received:", inputData);
  }, [])

  return (
    <div></div>
  )
}