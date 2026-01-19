import validateCoordinate from "../../utils/coordinates";
import checkFalsyValue from "../../utils/filterFalsyValue";
import { Initial_Roadmap } from "../../utils/initialRoadmap";

const dataBridgeForProperties = (properties = {}) => {
    const p = properties
    if (typeof properties === 'object') {
        // custom structure don't make function for that
        const converted = {
            // description
            title: p.title,
            description: p.description,
            category: p.category.id,
            listed_in: p.listed_in,
            agent: p.agent.id,
            status: p.status,
            price: p.price,
            featured: p.featured,
            images: p.images,
            order: p.order,
            video_from: p.video_from,
            embed_video_id: p.embed_video_id,
            virtual_tour: p.virtual_tour,
            plan: p.plan,
            address: p.address,
            interior_images: p.interior_images || [],
            interior_description: p.interior_description,
            exterior_images: p.exterior_images || [],
            exterior_description: p.exterior_description,
            floor_plan: p.floor_plan,
            floor_plan_thumbnail: p.floor_plan_thumbnail,
            brochure: p.brochure,
            brochure_thumbnail: p.brochure_thumbnail,
            country: p.country?.id,
            city: p.city?.id,
            // details
            launch_date: p.launch_date || "",
            area: p.area?.id || '',
            latitude: validateCoordinate(p.latitude),
            longitude: validateCoordinate(p.longitude),
            roadmap: Array.isArray(p.roadmap) ? p.roadmap : [Initial_Roadmap],
            // details
            size: p.size,
            features: p.features || [
                // 10
            ],
            // QR Code 4 inputs
            name: p.name,
            project_number: p.project_number,
            permit_no: p.permit_no,
            developer: p.developer?.id,
            qr_code: p.qr_code,
            // amenities
            amenities: p.amenities?.map(e => {
                if (typeof e === 'object' && e.amenity) {
                    return e.amenity
                }
                if (typeof e === 'number') {
                    return e
                }
            })?.filter(e => e),
        }
        return checkFalsyValue(converted)
    } else {
        throw new Error('property must be an object');
    }
};

// Example
// Debug using ChatGPT

export default dataBridgeForProperties

