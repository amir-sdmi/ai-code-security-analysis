export const heroNavLinks = [
  { text: "Woman's Fashion" },
  { text: "Men's Fashion" },
  { text: "Electronics" },
  { text: "Home & Lifestyle" },
  { text: "Medicine" },
  { text: "Sports & Outdoor" },
  { text: "Babys & Toys" },
  { text: "Groceries & Pets" },
  { text: "Health & Beauty" },
];

//change the textFirst and textSecond to be appropriate to the images (with chatGpt)
export const heroCarouselItems = [
  {
    id: 1,
    img: "/home/hero/carousel-1.png",
    textFirst: "Up to 10%",
    textSecond: "off Voucher",
    link: "#",
  },
  {
    id: 2,
    img: "/home/hero/carousel-2.png",
    textFirst: "Up to 22%",
    textSecond: "off Voucher",
    link: "#",
  },
  {
    id: 3,
    img: "/home/hero/carousel-3.png",
    textFirst: "Up to 5%",
    textSecond: "off Voucher",
    link: "#",
  },
  {
    id: 4,
    img: "/home/hero/carousel-4.png",
    textFirst: "Up to 14%",
    textSecond: "off Voucher",
    link: "#",
  },
  {
    id: 5,
    img: "/home/hero/carousel-5.png",
    textFirst: "Up to 19%",
    textSecond: "off Voucher",
    link: "#",
  },
];

export const Categories = [
  { name: "Phones", img: "/home/categories/Phone.svg" },
  { name: "Computers", img: "/home/categories/Computer.svg" },
  { name: "Smartwatch", img: "/home/categories/Smartwatch.svg" },
  { name: "Camera", img: "/home/categories/Camera.png" },
  { name: "HeadPhones", img: "/home/categories/Headphones.svg" },
  { name: "Gaming", img: "/home/categories/Gaming.svg" },
];

export const achievements = [
  {
    icon: "about/Sellers.svg",
    stat: "10.5k",
    desc: "Sellers active on our site",
  },
  {
    icon: "about/Sales.svg",
    stat: "33k",
    desc: "Monthly sold items",
  },
  {
    icon: "about/ActiveCustomer.svg",
    stat: "45.5k",
    desc: "Customer active on our site",
  },
  {
    icon: "about/Money.svg",
    stat: "25k",
    desc: "Annual gross sale on our site",
  },
];

export const accountSidebarItems = [
  {
    text: "Profile",
    alt: "Profile icon",
    icon: "/account/personal-information.png",
    link: "/account",
  },
  {
    text: "Order History",
    alt: "Order History icon",
    icon: "/account/order-history.png",
    link: "/account/orders",
    items: [
      { text: "Orders", link: "/account/orders" },
      { text: "Return Request", link: "/account/return-requests" },
      { text: "Cancellation Requests", link: "/account/cancellation-requests" },
    ],
  },
  {
    text: "Wishlist",
    alt: "Wishlist icon",
    icon: "/WishlistHeartFilled.svg",
    link: "/account/wishlist",
    items: [{ text: "View Wishlist", link: "/account/wishlist" }],
  } /*
  {
    text: "Payment Methods",
    alt: "Payment Methods icon",
    icon: "/account/payment-methods.png",
    link: "/account/payment-methods",
    /* items: [
      { text: "Saved Payment Methods", link: "/account/payment-methods" },
      { text: "Add New Payment Method", link: "/account/add-payment-method" },
    ], */ /*
  },

  {
    text: "Gift Cards",
    alt: "Gift Cards icon",
    icon: "/account/gift-cards.png",
    link: "/account/gift-cards",
    /* items: [
      {
        text: "Manage Gift Cards",
        link: "/account/gift-cards",
      },
    ], */,
  ,
  /*},
  {
    text: "Subscriptions & Notifications",
    alt: "Subscriptions & Notifications icon",
    icon: "/account/notifications.png",
    link: "/account/subscriptions-notifications",
    /* items: [
      { text: "Manage Subscriptions", link: "/account/manage-subscriptions" },
      {
        text: "Notification Preferences",
        link: "/account/notification-preferences",
      },
    ], */ /*
  }, */
  {
    text: "Account Settings",
    alt: "Account Settings icon",
    icon: "/account/settings.png",
    link: "/account/settings",
    /* items: [
      { text: "Privacy Settings", link: "/account/privacy-settings" },
      {
        text: "Two-Factor Authentication",
        link: "/account/two-factor-authentication",
      },
    ], */
  },
];
