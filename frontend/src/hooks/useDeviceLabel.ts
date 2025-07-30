import { useState, useEffect } from "react";

type DeviceInfo = {
    platform: string;
    label: string;
  };
  
  export function useDeviceLabel(): DeviceInfo {
    const [info, setInfo] = useState<DeviceInfo>({
      platform: "unknown",
      label: "Unknown Device",
    });
  
    useEffect(() => {
      const parseUserAgent = async () => {
        const ua = navigator.userAgent;
        const fallbackPlatform = navigator.platform || "unknown";
  
        let platform = "unknown";
        let label = "Unknown Device";
  
        // Prefer userAgentData if available
        if (navigator.userAgentData?.getHighEntropyValues) {
          try {
            const { platform: uaPlatform } = await navigator.userAgentData.getHighEntropyValues(["platform"]);
            platform = uaPlatform.toLowerCase();
          } catch {
            platform = fallbackPlatform.toLowerCase();
          }
        } else {
          platform = fallbackPlatform.toLowerCase();
        }
  
        // Heuristic mapping
        if (/iphone|ipad/.test(ua.toLowerCase())) {
          label = "iPhone (iOS)";
        } else if (/android/.test(ua.toLowerCase())) {
          label = "Android Phone";
        } else if (platform.includes("mac")) {
          label = "Mac (macOS)";
        } else if (platform.includes("win")) {
          label = "Windows PC";
        } else if (platform.includes("linux")) {
          label = "Linux Device";
        }
  
        setInfo({ platform, label });
      };
  
      parseUserAgent();
    }, []);
  
    return info;
  }