import validateCoordinate from "../../utils/coordinates";
import checkFalsyValue from "../../utils/filterFalsyValue";

const dataBridgeForProperties = (properties = {}) => {
    const p = properties
    if (typeof p === 'object') {
        // custom structure don't make function for that
        const converted = {
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
            floor_plan: p.floor_plan,
            floor_plan_thumbnail: p.floor_plan_thumbnail || '',
            address: p.address,
            country: p.country?.id,
            city: p.city?.id,
            area: p.area?.id,
            latitude: validateCoordinate(p.latitude),
            longitude: validateCoordinate(p.longitude),
            // details
            size: p.size,
            built_up_size: p.built_up_size,
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            parking: p.parking,
            garage_size: p.garage_size,
            year_built: p.year_built,
            basement: p.basement,
            extra_detail: p.extra_detail,
            // QR Code 4 inputs
            name: p.name,
            project_number: p.project_number,
            permit_no: p.permit_no,
            developer: p.developer?.id,
            qr_code: p.qr_code,
            // amenities
            amenities: p.amenities?.map(e => {
                if (typeof e === 'object' && e.id) {
                    return e.id
                }
                if (typeof e === 'number') {
                    return e
                }
            }).filter(e => e),
        }
        return checkFalsyValue(converted)
    } else {
        throw new Error('property must be an object');
    }
};

// Example
// Debug using ChatGPT

export default dataBridgeForProperties

