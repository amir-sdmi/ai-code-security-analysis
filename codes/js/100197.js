// Copied from this post, then modified it with chatGPT
// https://stackoverflow.com/questions/36904185/react-router-scroll-to-top-on-every-transition

import React, { useEffect, Fragment } from 'react';
import { withRouter } from 'react-router-dom';

function ScrollToTop({ history, children }) {
  useEffect(() => {
    let timeoutId;

    const unlisten = history.listen(() => {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }, 0);
    });

    return () => {
      unlisten();
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Fragment>{children}</Fragment>;
}

export default withRouter(ScrollToTop);
