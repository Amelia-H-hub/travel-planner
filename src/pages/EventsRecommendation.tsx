import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom";

export default function EventsRecommendation() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const location = useLocation();
  // receive search data from HomePage
  const searchData = location.state || {};

  // event data state
  const [events, setEvents] = useState<any[]>([]);

  // execute initially
  useEffect(() => {
    console.log('Search data received:', searchData);
    fetchEvents(searchData);
  }, []);

  // fetch events based on search data
  const fetchEvents = async (searchData: any) => {
    const res = await fetch(`${API_BASE_URL}/api/home/event/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(searchData)
    })
    const eventsData = await res.json();
    console.log('Events data:', eventsData.events);
    setEvents(eventsData.events || []);
  }
  
  return (
    <div className="before:absolute before:inset-0 before:bg-[#F7F6F1] before:-z-10">
      <div className="px-60 pb-20">
        <ul className="flex flex-wrap justify-center gap-20 overflow-hidden">
          {events.map((event) => (
            <li key={event.id} className="w-84 flex flex-col">
              <div className="w-full h-56 overflow-hidden">
                <img src={event.img_url}
                    alt="Event Thumbnail"
                    className="w-full h-full rounded-xl object-cover"/>
                  {/* image.url */}
              </div>
              <p className="w-full text-[#153533] text-2xl font-black break-words mt-4">
                {event.name}
                {/* name */}
              </p>
              <p className="w-full text-[#61706D] text-lg font-medium mt-3">
                {event.start_datetime}
                {/* start_date + start_time */}
                {/* timezone */}
              </p>
              <p className="w-full text-[#61706D] text-lg font-medium">
                {event.location}
                {/* primary_venue.address.localized_area_display */}
              </p>
              {event.min_ticket_price !== 'NoneNone' && (
                <p className="w-full text-[#131616] text-lg font-medium">
                  {event.min_ticket_price}
                  {/* ticket_availability.minimum_ticket_price.currency + major_value */}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}