import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom";
import { API_BASE_URL } from '@/constants';

interface Spot {
  type: string;
  value: {
    id: string;
    formattedAddress: string;
    location: {
      latitude: number;
      longitude: number;
    };
    regularOpeningHours: {
      openNow: boolean;
      periods: any[];
    };
    weekdayDescriptions: string[];
    displayName: {
      text: string;
      languageCode: string;
    }
    start_date: string;
    end_date: string;
  }
}

interface Schedule {
  date: string;
  weekday: string;
  data: Spot[]
}

export default function EventsRecommendation() {

  const location = useLocation();
  // receive search data from HomePage
  const searchData = location.state || {};

  // schedule data state
  const [schedule, setSchedule] = useState<Schedule[]>([]);

  // execute initially
  useEffect(() => {
    console.log('Search data received:', searchData);
    fetchEvents(searchData);
  }, []);

  // fetch events based on search data
  const fetchEvents = async (searchData: any) => {
    const res = await fetch(`${API_BASE_URL}/api/schedule/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(searchData)
    })
    const suggestions = await res.json();
    console.log('Events data:', suggestions.data);
    setSchedule(suggestions.data || []);
  }
  
  return (
    <div className="before:absolute before:inset-0 before:bg-[#F7F6F1] before:-z-10">
      <div className="px-60 pb-20">
        <ul className="flex justify-center gap-10">
          {schedule.map((day) => (
            <li key={day.date}>
              <div className="w-full">
                {day.date}
              </div>
              <ul>
                {day.data.map((spot) => (
                  <li key={spot.value.id} className="flex justify-start">
                    <div className="text-gray-700">
                      {spot.value.displayName.text}
                    </div>
                    <div className="text-gray-700">
                      {spot.value.formattedAddress}
                    </div>
                    {spot.type === "event" && (
                      <>
                        <div className="text-gray-700">
                          {spot.value.start_date}
                        </div>
                        <div className="text-gray-700">
                          {spot.value.end_date}
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        {/* <ul className="flex flex-wrap justify-center gap-20 overflow-hidden">
          {events.map((event) => (
            <li key={event.id} className="w-84 flex flex-col">
              <div className="w-full h-56 overflow-hidden">
                <img src={event.img}
                    alt="Event Thumbnail"
                    className="w-full h-full rounded-xl object-cover"/>
                  image.url
              </div>
              <p className="w-full text-[#153533] text-2xl font-black break-words mt-4">
                {event.title}
                name
              </p>
              <p className="w-full text-[#61706D] text-lg font-medium mt-3">
                {event.start_date} {event.end_date}
                start_date + start_time
                timezone
              </p>
              <p className="w-full text-[#61706D] text-lg font-medium">
                {event.address}
                primary_venue.address.localized_area_display
              </p>
            </li>
          ))}
        </ul> */}
      </div>
    </div>
  )
}