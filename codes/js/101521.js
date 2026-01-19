import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/OfficialCityWhispererLogo.png';
import { Spiral as Hamburger } from 'hamburger-react'
import './NavBar.css';

function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const loc = useLocation()

  const toggleMenu = () => {
    setMenuOpen(menuOpen => !menuOpen);
  };

  return (
    <div className='mb-[-65px] navBar'>
      <nav
        className={loc.pathname !== '/' ? 'bg-[#fffffff6] fixed w-full z-20 top-0 left-0 border-b-0 border-gray-200 custom-border pb-0 pt-0 px-3 h-[12%] max-[760px]:h-[7%] shadow-2xl' : 'bg-white bg-opacity-0 fixed w-full z-20 top-0 left-0 border-b-0 border-gray-200 custom-border pb-0 pt-0'}>
        <div className="flex flex-wrap items-center justify-between  pt-2 text-sky-950 ml-16 mr-16 max-[760px]:mx-0 ">
          <span className="logo">
            <a href="/" className="w-[172px] h-auto flex flex-col items-center"> {/* Use flex-col to stack items vertically */}
              <img
                src={logo}
                className="mt-1.5 mr-3 w-[120%] h-[120%]  max-[760px]:w-[35%] max-[760px]:ml-[-50px] drop-shadow-[2px_0px_5px_rgba(255,255,255,0.5)]"
                alt="CityWhisperer Logo"
              />
              {/* <span className="text-center text-xs">Powered by chatGPT</span> */}
            </a>
          </span>

          <div className="flex md:order-2 ml-auto inline-flex text-xl font-bold">
            {/* Desktop Menu & Tablet Menu */}
            <ul className="DESKTOP-MENU hidden space-x-8 md:flex lg:flex text-xxl">
              <li>
                <a href="/" className="nav-link home text-sky-950 text-shadow-white drop-shadow-lg">
                  Home
                </a>
              </li>
              <li>
                <Link to="/about" className="nav-link about text-sky-950 text-shadow-white drop-shadow-lg">
                  About
                </Link>
              </li>
              <li>
                <Link to="/tours" className="nav-link browsetours text-sky-950 text-shadow-white drop-shadow-lg">
                  Browse Tours
                </Link>
              </li>
              <li>
                <Link
                  to="/createnewtour"
                  type="button"
                  data-te-ripple-init
                  data-te-ripple-color="light"
                  className="create-new-tour rounded bg-[#25588d]
                  border border-gray-500
                  px-3 pb-1 pt-1 text-xs font-bold text-[#dbd4db] uppercase leading-normal transition duration-150 ease-in-out
                  hover:bg-primary-600 hover:shadow-[0px 0px 0px #fff]
                  focus:bg-primary-600 focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)]
                  focus:outline-none focus:ring-0
                  active:bg-primary-700 active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)]
                  dark:shadow-[0_4px_9px_-4px_rgba(59,113,202,0.5)]
                  dark:hover:shadow-[0px 0px 0px #fff]
                  dark:focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)]
                  dark:active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)]
                  hover:scale-110"
                >
                  <strong>Create New Tour</strong>
                </Link>
              </li>
            </ul>
            <button
              onClick={toggleMenu}
              data-collapse-toggle="navbar-sticky"
              type="button"
              className={loc.pathname !== "/" ? "inline-flex items-center p-2 w-10 h-10  justify-center text-sm text-black rounded-lg md:hidden hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-gray-200" : "inline-flex items-center p-2 w-10 h-10  justify-center text-sm text-white rounded-lg md:hidden hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-gray-200"}
              aria-controls="navbar-sticky"
              aria-expanded={menuOpen}
            >
              <span className="sr-only ">Open main menu</span>
              <div className="bg-transparent rounded-lg p-0 items-center h-12 w-12 mr-10">
                <Hamburger
                  className="spiral"
                  toggled={menuOpen} //automatic open and close once clicked to another page
                  size={10}
                  hideOutline={false}
                />
              </div>
            </button>
          </div>
          {/* Mobile Menu */}
          <div
            className={`items-center justify-between w-full md:w-auto md:order-1 ${menuOpen ? 'block' : 'hidden'
              } md:hidden`}
            id="navbar-sticky"
          >
            <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 md:mt-0 md:border-0 md:bg-white">
              <li>
                <a href="/"
                  onClick={toggleMenu}
                  className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0"
                  aria-current="page"
                >
                  Home
                </a>
              </li>
              <li>
                <Link
                  to="/about"
                  onClick={toggleMenu}
                  className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/tours"
                  onClick={toggleMenu}
                  className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0"
                >
                  Browse Tours
                </Link>
              </li>
              <li className="md:hidden">
                <Link
                  to="/createnewtour"
                  onClick={toggleMenu}
                  className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0"
                >
                  Create New Tour
                </Link>
              </li>
            </ul>
          </div>
        </div >
      </nav >
    </div >
  );
}

export default NavBar;
