//\components\homepage\Banner.js
import React from 'react';
import Image from 'next/image';
import Slider from 'react-slick'; // Importing React Slick
import Link from 'next/link';

/**
 * Helped with chatGPT
 * This component displays a carousel of promotional banners using the React Slick library.
 * Each banner features an image, title, description, and a "Shop Now" button that links
 *    to a product page. The component supports autoplay, navigation dots.
 */
function Banner() {
  const banners = [
    { 
      src: '/banner1.jpg', 
      alt: 'Banner 1', 
      title: '20% off headset', 
      description: 'Limited-time offer for July',
      textposition: 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-white',
      link: '/all-products?category=4', // 耳机分类页面
      categoryName: 'Headphones'
    },
    { 
      src: '/banner2.jpg', 
      alt: 'Banner 2', 
      title: 'New Collection', 
      description: 'Explore the latest trends',
      textposition: 'absolute top-1/2 left-1/2 transform -translate-y-1/2 text-left text-white',
      link: '/all-products?new=true', // 新品页面
      categoryName: 'New Arrivals'
    },
    { 
      src: '/banner3.jpg', 
      alt: 'Banner 3', 
      title: 'Holiday Deals', 
      description: 'Up to 50% off on selected items',
      textposition: 'absolute top-1/2 left-1/2 transform -translate-y-1/2  text-left text-white',
      link: '/all-products?sale=true', // 促销页面
      categoryName: 'Sale Items'
    }
  ];

  // Slider settings for react-slick
  const settings = {
    dots: true, // Show dots for navigation
    infinite: true,
    speed: 500,
    slidesToShow: 1, 
    slidesToScroll: 1,
    autoplay: true, // Enables autoplay
    autoplaySpeed: 3000, // Slide interval (ms)
    arrows: true, // Show next/previous arrows};
  }

  
  return (
    // <div className="relative h-[550px] px-16 py-6">
    <div className="relative w-full min-h-[300px] sm:min-h-[400px] md:min-h-[550px] px-4 sm:px-8 py-6">
      <Slider {...settings}>
        {banners.map((banner, index) => (
          <div key={index} className="relative w-full min-h-[250px] sm:min-h-[350px] md:min-h-[500px]">
            <Image
              src={banner.src}
              alt={banner.alt}
              fill
              style={{ objectFit: 'cover' }}
              priority={index === 0} //only set priority for the first image
            />
            <div className={`${banner.textposition}`}>
              <h1 className="text-6xl font-extrabold mb-4">{banner.title}</h1>
              <p className="mt-2 text-2xl mb-4">{banner.description}</p>
              <Link 
                href={banner.link}
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Shop {banner.categoryName}

              </Link>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
}

export default Banner;
