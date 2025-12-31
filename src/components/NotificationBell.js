import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUserNotifications, markNotificationAsRead, getUnreadCount } from "../utils/notificationUtils";

export default function NotificationBell() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifs = async () => {
    if (currentUser) {
      const data = await getUserNotifications(currentUser.uid);
      setNotifications(data);
      const count = await getUnreadCount(currentUser.uid);
      setUnreadCount(count);
    }
  };

  // Poll for notifications every 30 seconds
  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000); 
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [currentUser]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
        await fetchNotifs(); 
    }
  };

  const handleRead = async (id, isRead) => {
    if (!isRead) {
        await markNotificationAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* BELL ICON */}
      <button onClick={handleOpen} className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors outline-none">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
        
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-700">Notifications</h3>
            <button onClick={fetchNotifs} className="text-xs text-blue-600 hover:underline">Refresh</button>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">No notifications yet.</div>
            ) : (
                notifications.map((n) => (
                    <div 
                        key={n.id} 
                        onClick={() => handleRead(n.id, n.isRead)}
                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                    >
                        <p className="text-sm font-bold text-gray-800">{n.title}</p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-2 text-right">{new Date(n.createdAt).toLocaleDateString()}</p>
                    </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}