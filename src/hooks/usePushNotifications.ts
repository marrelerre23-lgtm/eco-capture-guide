import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported("Notification" in window);
    
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: "Inte tillgängligt",
        description: "Push-notiser stöds inte i din webbläsare.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        toast({
          title: "Notiser aktiverade! 🔔",
          description: "Du kommer få påminnelser om nya arter att upptäcka.",
        });
        return true;
      } else if (result === "denied") {
        toast({
          title: "Notiser nekade",
          description: "Du kan aktivera dem senare i inställningarna.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  const scheduleReminder = (title: string, body: string, delayMs: number = 0) => {
    if (permission !== "granted") {
      console.log("Notification permission not granted");
      return;
    }

    setTimeout(() => {
      new Notification(title, {
        body,
        icon: "/placeholder.svg",
        badge: "/placeholder.svg",
        tag: "ecocapture-reminder",
        requireInteraction: false,
      });
    }, delayMs);
  };

  const scheduleDailyReminder = () => {
    if (permission !== "granted") return;

    // Schedule a reminder for tomorrow at 10 AM
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const delayMs = tomorrow.getTime() - now.getTime();

    scheduleReminder(
      "Dags att utforska! 🌿",
      "Hitta nya arter idag och fyll din loggbok!",
      delayMs
    );
  };

  return {
    permission,
    isSupported,
    requestPermission,
    scheduleReminder,
    scheduleDailyReminder,
    hasPermission: permission === "granted",
  };
};
