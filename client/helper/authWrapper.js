import Router from "next/router";
import Navbar from "../components/Navbar";

export const getLocalStorageData = (name) => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(name);
  }
  return null;
};

/**
 * Higher-order component that wraps a page with the Navbar
 * and guards the route — unauthenticated users are redirected to "/".
 */
const authWrapper = (WrappedComponent) => {
  // eslint-disable-next-line react/display-name
  return (props) => {
    if (typeof window !== "undefined") {
      const walletAddress = getLocalStorageData("ADDRESS");

      if (!walletAddress) {
        // Redirect to home / connect-wallet page if not authenticated
        Router.replace("/");
        return null;
      }

      return (
        <>
          <Navbar />
          <WrappedComponent {...props} />
        </>
      );
    }

    // During SSR, render nothing — the client will handle the redirect
    return null;
  };
};

export default authWrapper;
