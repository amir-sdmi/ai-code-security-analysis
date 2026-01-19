// WARNING : this code is generated using Cursor and default settings for models

import { MCPTool } from "mcp-framework";
import { z } from "zod";

interface HaversineInput {
  lon1: number;
  lat1: number;
  lon2: number;
  lat2: number;
}

class HaversineTool extends MCPTool<HaversineInput> {
  name = "haversine";
  description = "Calcul de la distance entre deux points géographiques en utilisant la formule de Haversine";

  schema = {
    lon1: {
      type: z.number(),
      description: "Longitude du point 1",
    },
    lat1: {
      type: z.number(),
      description: "Latitude du point 1",
    },
    lon2: {
      type: z.number(),
      description: "Longitude du point 2",
    },
    lat2: {
      type: z.number(),
      description: "Latitude du point 2",
    },
  };

  computeHaversine(lon1: number, lat1: number, lon2: number, lat2: number) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance en km
    return distance;
  }

  async execute(input: HaversineInput) {
    return this.computeHaversine(input.lon1, input.lat1, input.lon2, input.lat2);
  }
}

export default HaversineTool;