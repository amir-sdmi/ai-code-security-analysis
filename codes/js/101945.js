// This page will be useed to test the canvas component changes
import "../../style/Testing.css";
// lets usse framer motion to animate the svg
import { motion } from "framer-motion";
import bounce from "./bouncing-circles.svg";
import sun from "./sun.svg";

const SVGExample = () => {
  return (
    <>
      <div className="svgpage-container">
        <div className="SVGTitle">First Animated SVG:</div>
        <svg
          style={{ backgroundColor: "white", borderRadius: "10px" }}
          width="200"
          height="200"
        >
          <g>
            <circle
              cx="100"
              cy="100"
              r="40"
              stroke="black"
              strokeWidth="3"
              fill="red"
            />
            <polygon points="80 110, 100 90, 120, 110" fill="lime" />
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 100 100"
              to="360 100 100"
              dur="5s"
              repeatCount="indefinite"
            />
          </g>
        </svg>

        <div className="SVGTitle">Sun:</div>
        <motion.svg
          style={{ backgroundColor: "rgb(132,199,227)", borderRadius: "10px" }}
          width="200"
          height="200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {/* lets make a sun */}
          <motion.g
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          >
            <motion.circle
              cx="100"
              cy="100"
              r="40"
              stroke="orange"
              strokeWidth="3"
              fill="rgb(255,204,102)"
            />
            {/* here lets add a smiley face in the sun */}
            <motion.circle cx="90" cy="90" r="2" fill="black" />
            <motion.circle cx="110" cy="90" r="2" fill="black" />
            <motion.path
              d="M 90 105 Q 100 120 110 105Z"
              stroke="black"
              strokeWidth={2}
              fill="WHITE"
            />
            <motion.g
              animate={{ rotate: [0, -360] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            >
              <motion.polygon
                points="90 55, 100 45, 110 55"
                stroke="orange"
                strokeWidth="3"
                fill="rgb(255,204,102)"
              />
              <motion.polygon
                points="90 145, 100 155, 110 145"
                stroke="orange"
                strokeWidth="3"
                fill="rgb(255,204,102)"
              />
              <motion.polygon
                points="55 90, 45 100, 55 110"
                stroke="orange"
                strokeWidth="3"
                fill="rgb(255,204,102)"
              />
              <motion.polygon
                points="145 90, 155 100, 145 110"
                stroke="orange"
                strokeWidth="3"
                fill="rgb(255,204,102)"
              />
            </motion.g>
            <motion.g
              initial={{ rotate: 45 }}
              animate={{ rotate: [45, 405] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            >
              <motion.polygon
                points="90 55, 100 35, 110 55"
                stroke="orange"
                strokeWidth="3"
                fill="rgb(239,142,32)"
              />
              <motion.polygon
                points="90 145, 100 165, 110 145"
                stroke="orange"
                strokeWidth="3"
                fill="rgb(239,142,32)"
              />
              <motion.polygon
                points="55 90, 35 100, 55 110"
                stroke="orange"
                strokeWidth="3"
                fill="rgb(239,142,32)"
              />
              <motion.polygon
                points="145 90, 165 100, 145 110"
                stroke="orange"
                strokeWidth="3"
                fill="rgb(239,142,32)"
              />
            </motion.g>
          </motion.g>
        </motion.svg>
        <div style={{ width: 300 }} className="SVGTitle">Sun as OBJ:</div>
        <object
          style={{ borderRadius: "10px" }}
          data={sun}
          type="image/svg+xml"
          height="200"
        ></object>
        <div style={{ width: 300 }} className="SVGDescription">Converted From React inline svg with framer for animation to svg file using ChatGPT!</div>

        <div className="SVGTitle">Waves:</div>
        <motion.svg style={{ backgroundColor: "rgb(132,199,227)", borderRadius: "10px" }}
          width="400"
          height="200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}>
        <motion.path initial={{x:-30}} animate={{x:[-30, -15, 0, 15, 30]}} transition={{duration: 5, repeat: Infinity, ease: "linear"}} d="M -40 100 Q -10 170 20 100 Q 50 170 80 100 Q 110 170 140 100 Q 170 170 200 100 Q 230 170 260 100 Q 290 170 320 100 Q 350 170 380 100 Q 410 170 440 100 V 200 H -40 Z" stroke="black" fill="rgb(0,92,108)"/>
        <motion.path initial={{x:30}} animate={{x:[30, 15, 0, -15, -30]}} transition={{duration: 5, repeat: Infinity, ease: "linear"}} d="M -40 100 Q -10 170 20 100 Q 50 170 80 100 Q 110 170 140 100 Q 170 170 200 100 Q 230 170 260 100 Q 290 170 320 100 Q 350 170 380 100 Q 410 170 440 100 V 200 H -40 Z" stroke="black" fill="rgb(101,218,227)"/>

        </motion.svg>

        <div className="SVGTitle">Waves with Sun (scalable):</div>
        <motion.svg style={{ backgroundColor: "rgb(132,199,227)", borderRadius: "10px" }}
          width="50vw"
          height="25vw"
          viewBox="0 0 400 200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}>
        <motion.path initial={{x:-30}} animate={{x:[-30, -15, 0, 15, 30]}} transition={{duration: 5, repeat: Infinity, ease: "linear"}} d="M -40 100 Q -10 170 20 100 Q 50 170 80 100 Q 110 170 140 100 Q 170 170 200 100 Q 230 170 260 100 Q 290 170 320 100 Q 350 170 380 100 Q 410 170 440 100 V 200 H -40 Z" stroke="black" fill="rgb(0,92,108)"/>
        <motion.path initial={{x:30}} animate={{x:[30, 15, 0, -15, -30]}} transition={{duration: 5, repeat: Infinity, ease: "linear"}} d="M -40 100 Q -10 170 20 100 Q 50 170 80 100 Q 110 170 140 100 Q 170 170 200 100 Q 230 170 260 100 Q 290 170 320 100 Q 350 170 380 100 Q 410 170 440 100 V 200 H -40 Z" stroke="black" fill="rgb(101,218,227)"/>
        <motion.g
            initial={{x:225, y:-50}}
            animate={{ scale: [.5, .75, .5] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          >
            <motion.circle
              cx="100"
              cy="100"
              r="40"
              stroke="orange"
              strokeWidth="3"
              fill="rgb(255,204,102)"
            />
            {/* here lets add a smiley face in the sun */}
            <motion.circle cx="90" cy="90" r="2" fill="black" />
            <motion.circle cx="110" cy="90" r="2" fill="black" />
            <motion.path
              d="M 90 105 Q 100 120 110 105Z"
              stroke="black"
              strokeWidth={2}
              fill="WHITE"
            />
            <motion.g
              animate={{ rotate: [0, -360] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            >
              <motion.polygon
                points="90 55, 100 45, 110 55"
                stroke="orange"
                strokeWidth="3"
                fill="rgb(255,204,102)"
              />
              <motion.polygon
                points="90 145, 100 155, 110 145"
                stroke="orange"
                strokeWidth="3"
                fill="rgb(255,204,102)"
              />
              <motion.polygon
                points="55 90, 45 100, 55 110"
                stroke="orange"
                strokeWidth="3"
                fill="rgb(255,204,102)"
              />
              <motion.polygon
                points="145 90, 155 100, 145 110"
                stroke="orange"
                strokeWidth="3"
                fill="rgb(255,204,102)"
              />
            </motion.g>
            <motion.g
              initial={{ rotate: 45 }}
              animate={{ rotate: [45, 405] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            >
              <motion.polygon
                points="90 55, 100 35, 110 55"
                stroke="orange"
                strokeWidth="3"
                fill="rgb(239,142,32)"
              />
              <motion.polygon
                points="90 145, 100 165, 110 145"
                stroke="orange"
                strokeWidth="3"
                fill="rgb(239,142,32)"
              />
              <motion.polygon
                points="55 90, 35 100, 55 110"
                stroke="orange"
                strokeWidth="3"
                fill="rgb(239,142,32)"
              />
              <motion.polygon
                points="145 90, 165 100, 145 110"
                stroke="orange"
                strokeWidth="3"
                fill="rgb(239,142,32)"
              />
            </motion.g>
          </motion.g>
        </motion.svg>



        <div className="SVGTitle">Bouncing IMG Circles:</div>
        <img style={{ height: 200 }} src={bounce} alt="bouncing circles" />


        <div style={{ width: 300 }} className="SVGTitle">Bouncing OBJ Circles:</div>
        <object data={bounce} type="image/svg+xml" height="200"></object>
        <div style={{ width: 300 }} className="SVGDescription">OBJ vs IMG allows access to predefined scripts in svg file!</div>

      </div>
    </>
  );
};

export default SVGExample;
