import { useState, useEffect, useRef } from 'react';
import { getRelativeTime } from '@/lib/utils';

export function useRelativeTime(timestamp: number) {
    const [relativeTime, setRelativeTime] = useState(() => getRelativeTime(timestamp));
    const timerRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        // Clean up previous timer if it exists
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        // Calculate initial age
        const age = Date.now() - timestamp;

        // Don't set up timer for old timestamps
        if (age > 30 * 24 * 60 * 60 * 1000) { // > 30 days
            setRelativeTime(getRelativeTime(timestamp));
            return;
        }

        // Set initial value
        setRelativeTime(getRelativeTime(timestamp));

        // Determine update interval based on age
        let interval: number;
        if (age < 60 * 1000) { // < 1 minute
            interval = 1000; // Update every second
        } else if (age > 24 * 60 * 60 * 1000) { // > 24 hours
            interval = 60 * 60 * 1000; // Update hourly
        } else {
            interval = 30 * 1000; // Update every 30 seconds for recent items
        }

        // Set up new timer
        timerRef.current = setInterval(() => {
            setRelativeTime(getRelativeTime(timestamp));
            // Check if we need to adjust the interval
            const newAge = Date.now() - timestamp;
            if (newAge >= 60 * 1000 && interval === 1000) { // Just passed 1 minute
                // Clear current interval and set up new one
                clearInterval(timerRef.current);
                timerRef.current = setInterval(() => {
                    setRelativeTime(getRelativeTime(timestamp));
                }, 30 * 1000); // Switch to 30-second updates
            }
        }, interval);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [timestamp]);

    return relativeTime;
}