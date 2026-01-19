//ViewBuilder>App.js - COMPLETE CORRECT VERSION WITH ADMIN ACCESS CONTROL - MODAL FORM IMPLEMENTATION AND SET COMPARATOR SUPPORT
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GoogleLogin } from "@react-oauth/google";
import axios from 'axios';
import './App.css';
import EditViews from './EditViews';
import FormSelectorModal from './FormSelectorModal';
import ColumnConfigModal from './ColumnConfigModal';
import ActionButtonsModal from './ActionButtonsModal';
import { useAuth } from "./context/AuthContext";
import axiosClient from "./api/axiosClient";

// MODIFIED FormModal Component with proper session management
function FormModal({ isOpen, onClose, formUrl, formTitle }) {
  const iframeRef = useRef(null);
  const modalRef = useRef(null);
  const headerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 900, height: 600 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [preMaximizeState, setPreMaximizeState] = useState({ position: { x: 100, y: 100 }, size: { width: 900, height: 600 } });
  const [preMinimizeState, setPreMinimizeState] = useState({ position: { x: 100, y: 100 }, size: { width: 900, height: 600 } });

  // Reset position and size when modal opens
  useEffect(() => {
    if (isOpen) {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      // const defaultWidth = Math.min(900, screenWidth * 0.8);
      // const defaultHeight = Math.min(600, screenHeight * 0.8);
      const defaultWidth = Math.min(1200, screenWidth * 0.9);  // Increased from 900 to 1200, and 0.8 to 0.9
      const defaultHeight = Math.min(800, screenHeight * 0.9); // Increased from 600 to 800, and 0.8 to 0.85
      
      setSize({ width: defaultWidth, height: defaultHeight });
      setPosition({ 
        x: (screenWidth - defaultWidth) / 2, 
        y: Math.max(50, (screenHeight - defaultHeight) / 2) 
      });
      setIsMaximized(false);
      setIsMinimized(false);
      
      if (iframeRef.current) {
        setTimeout(() => {
          if (iframeRef.current) {
            iframeRef.current.focus();
          }
        }, 100);
      }
    }
  }, [isOpen]);

  // Handle mouse down on header for dragging
  const handleMouseDown = (e) => {
    if (e.target.closest('.modal-controls') || (isMaximized && !isMinimized) || isMinimized) return;
    
    setIsDragging(true);
    const rect = modalRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    e.preventDefault();
  };

  // Handle mouse down on resize handles
  const handleResizeMouseDown = (e, direction) => {
    if (isMaximized || isMinimized) return;
    
    setIsResizing({ direction, startX: e.clientX, startY: e.clientY, startSize: size, startPos: position });
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle mouse move for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && !isMaximized && !isMinimized) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Keep modal within screen bounds
        const maxX = window.innerWidth - 100; // Leave at least 100px visible
        const maxY = window.innerHeight - 100;
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
      
      if (isResizing && !isMaximized && !isMinimized) {
        const { direction, startX, startY, startSize, startPos } = isResizing;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        let newSize = { ...startSize };
        let newPos = { ...startPos };
        
        if (direction.includes('e')) {
          newSize.width = Math.max(300, startSize.width + deltaX);
        }
        if (direction.includes('w')) {
          const newWidth = Math.max(300, startSize.width - deltaX);
          newPos.x = startPos.x + (startSize.width - newWidth);
          newSize.width = newWidth;
        }
        if (direction.includes('s')) {
          newSize.height = Math.max(200, startSize.height + deltaY);
        }
        if (direction.includes('n')) {
          const newHeight = Math.max(200, startSize.height - deltaY);
          newPos.y = startPos.y + (startSize.height - newHeight);
          newSize.height = newHeight;
        }
        
        // Keep within screen bounds
        newSize.width = Math.min(newSize.width, window.innerWidth - newPos.x);
        newSize.height = Math.min(newSize.height, window.innerHeight - newPos.y);
        
        setSize(newSize);
        setPosition(newPos);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = isDragging ? 'grabbing' : 'default';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, isResizing, dragOffset, isMaximized, isMinimized]);

  // NEW: Listen for form submission messages to auto-close modal
  useEffect(() => {
    const handleMessage = (event) => {
      // Security check - you might want to verify origin in production
      if (event.data && event.data.type === 'FORM_SUBMITTED') {
        console.log('[DEBUG] FormModal: Received form submission notification, closing modal');
        handleActualClose();
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Handle double-click to maximize/restore
  const handleDoubleClick = () => {
    if (isMinimized) return; // Prevent double-click action when minimized
    
    if (isMaximized) {
      setPosition(preMaximizeState.position);
      setSize(preMaximizeState.size);
      setIsMaximized(false);
    } else {
      setPreMaximizeState({ position, size });
      setPosition({ x: 20, y: 20 });
      setSize({ width: window.innerWidth - 40, height: window.innerHeight - 40 });
      setIsMaximized(true);
    }
  };

  // Handle minimize/restore
  const handleMinimize = () => {
    if (isMinimized) {
      // Restore from minimize
      setPosition(preMinimizeState.position);
      setSize(preMinimizeState.size);
      setIsMinimized(false);
      setIsMaximized(false); // Reset maximize state when restoring from minimize
    } else {
      // Minimize
      setPreMinimizeState({ position, size });
      // Position at bottom-left corner with small size
      setPosition({ x: 20, y: window.innerHeight - 80 });
      setSize({ width: 250, height: 50 });
      setIsMinimized(true);
      setIsMaximized(false);
    }
    // NOTE: Minimizing does NOT call onClose - the session should remain active
  };

  // Handle maximize/restore button
  const handleMaximize = () => {
    if (isMinimized) {
      // If minimized, first restore then maximize
      setPosition({ x: 20, y: 20 });
      setSize({ width: window.innerWidth - 40, height: window.innerHeight - 40 });
      setIsMinimized(false);
      setIsMaximized(true);
    } else if (isMaximized) {
      setPosition(preMaximizeState.position);
      setSize(preMaximizeState.size);
      setIsMaximized(false);
    } else {
      setPreMaximizeState({ position, size });
      setPosition({ x: 20, y: 20 });
      setSize({ width: window.innerWidth - 40, height: window.innerHeight - 40 });
      setIsMaximized(true);
    }
    // NOTE: Maximizing does NOT call onClose - the session should remain active
  };

  // MODIFIED: Handle actual close (X button) - this ends the session
  const handleActualClose = () => {
    console.log('[DEBUG] FormModal: Actual close triggered - ending session');
    onClose(); // This will end the form session and clear stored parameters
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-draggable">
      <div 
        ref={modalRef}
        className={`modal-content-draggable ${isMaximized ? 'maximized' : ''} ${isMinimized ? 'minimized' : ''}`}
        style={{
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
        }}
      >
        <div 
          ref={headerRef}
          className="modal-header-draggable"
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          onClick={isMinimized ? handleMinimize : undefined}
          style={{ cursor: isDragging ? 'grabbing' : (isMinimized ? 'pointer' : 'grab') }}
        >
          <h5 className="modal-title-draggable">{formTitle || 'Form'}</h5>
          <div className="modal-controls">
            {!isMinimized && (
              <button
                className="btn btn-sm btn-outline-secondary me-2"
                onClick={() => {
                  if (formUrl) {
                    window.open(formUrl, '_blank');
                  }
                }}
                title="Open in new tab"
              >
                ↗️ Open in Tab
              </button>
            )}
            <button
              className="btn btn-sm btn-outline-secondary me-2"
              onClick={handleMinimize}
              title={isMinimized ? "Restore" : "Minimize"}
            >
              {isMinimized ? '🗗' : '🗕'}
            </button>
            {!isMinimized && (
              <button
                className="btn btn-sm btn-outline-secondary me-2"
                onClick={handleMaximize}
                title={isMaximized ? "Restore" : "Maximize"}
              >
                {isMaximized ? '🗗' : '🗖'}
              </button>
            )}
            {/* MODIFIED: Close button now calls handleActualClose to end the session */}
            <button
              className="btn-close-draggable"
              onClick={handleActualClose}
              aria-label="Close"
              title="Close form (ends session)"
            >
              ×
            </button>
          </div>
        </div>
          <div className="modal-body-draggable">
            {formUrl && (
              <iframe
                ref={iframeRef}
                src={formUrl}
                className="form-iframe"
                title={formTitle || 'Form'}
                onLoad={() => {
                  console.log('Form loaded in modal');
                }}
              />
            )}
          </div>
        
        {/* Resize handles - only show when not maximized or minimized */}
        {!isMaximized && !isMinimized && (
          <>
            <div className="resize-handle resize-n" onMouseDown={(e) => handleResizeMouseDown(e, 'n')} />
            <div className="resize-handle resize-s" onMouseDown={(e) => handleResizeMouseDown(e, 's')} />
            <div className="resize-handle resize-e" onMouseDown={(e) => handleResizeMouseDown(e, 'e')} />
            <div className="resize-handle resize-w" onMouseDown={(e) => handleResizeMouseDown(e, 'w')} />
            <div className="resize-handle resize-ne" onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} />
            <div className="resize-handle resize-nw" onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} />
            <div className="resize-handle resize-se" onMouseDown={(e) => handleResizeMouseDown(e, 'se')} />
            <div className="resize-handle resize-sw" onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} />
          </>
        )}
      </div>
    </div>
  );
}

// Main App component
function App() {
  const { idToken, userEmail, login, logout } = useAuth();
  const [firstLog, setFirstLog] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [currentPage, setCurrentPage] = useState('viewBuilder');
  const [currentViewId, setCurrentViewId] = useState('');
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Define admin users who can access edit features
  const adminEmails = [
    'manav.jain@motusnova.com',
    'parth.patel@motusnova.com',
    'david.wu@motusnova.com',
    'divyesh.ved@motusnova.com',
    'luke.jourden@motusnova.com'
  ];

  // Check if current user is an admin
  const isAdmin = adminEmails.includes(userEmail);

  // Handle Google Login
  const handleLogin = async (credentialResponse) => {
    const idToken = credentialResponse.credential;

    try {
      const response = await axiosClient.get("/auth/google", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.status === 200) {
        login(idToken, response.data.email);
        console.log("Access granted to:", response.data.email);
        setFirstLog(true);
        setSessionExpired(false);
      } else {
        console.log("Access denied");
        alert("Access denied: Authentication failed");
      }
    } catch (err) {
      if (err.response?.status === 403) {
        alert("Access denied: Please contact support for access to ViewBuilder");
      } else {
        console.error("Login error", err);
        alert("Authentication error: Please try again");
      }
    }
  };

  // Check for existing session on app load
  useEffect(() => {
    const checkCookie = async () => {
      try {
        const response = await axiosClient.get("/api/secret");
        if (response.status === 200) {
          setFirstLog(true);
          setSessionExpired(false);
          if (response.data.email) {
            login(null, response.data.email);
          }
        }
      } catch (err) {
        console.log("No existing session found");
        setFirstLog(false);
      }
    };

    checkCookie();
  }, [login]);

  // Component for unauthorized access
  const UnauthorizedAccess = () => (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 text-center">
          <div className="card border-warning">
            <div className="card-body">
              <h1 className="text-warning mb-4">🔒 Access Restricted</h1>
              <h5 className="card-title">Administrator Access Required</h5>
              <p className="card-text mb-4">
                You are currently logged in as: <strong>{userEmail}</strong>
              </p>
              <p className="card-text mb-4">
                This section of ViewBuilder requires administrator privileges. 
                Only designated administrators can create and edit views.
              </p>
              <hr />
              <small className="text-muted">
                If you need administrator access, please contact one of the administrators.
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // useEffect(() => {
  //   // Parse URL path to determine initial page, view ID, and view-only mode
  //   const path = window.location.pathname.split('/');
  //   console.log('Path segments:', path, 'User is admin:', isAdmin);
    
  //   if (path[1] === 'viewBuilderApp') {
  //     if (path[2] === 'edit') {
  //       if (isAdmin) {
  //         setCurrentPage('editViews');
  //       } else {
  //         console.log('Non-admin user blocked from edit page');
  //         setCurrentPage('unauthorized');
  //       }
  //     } else if (path[2] === 'view-only' && path[3]) {
  //       setCurrentPage('viewBuilder');
  //       setCurrentViewId(path[3]);
  //       setIsViewOnly(true);
  //       console.log('View-only mode activated for view:', path[3]);
  //     } else if (path[2]) {
  //       if (isAdmin) {
  //         setCurrentPage('viewBuilder');
  //         setCurrentViewId(path[2]);
  //         setIsViewOnly(false);
  //       } else {
  //         console.log('Non-admin user blocked from editable view URL');
  //         setCurrentPage('unauthorized');
  //       }
  //     } else {
  //       setCurrentPage('viewBuilder');
  //     }
  //   }
  // }, [isAdmin, userEmail]);

  useEffect(() => {
    // Parse URL path to determine initial page, view ID, and view-only mode
    const path = window.location.pathname.split('/');
    const fullUrl = window.location.href;
    console.log('Path segments:', path, 'User is admin:', isAdmin);
    console.log('Full URL:', fullUrl);
    
    if (path[1] === 'viewBuilderApp') {
      if (path[2] === 'edit') {
        if (isAdmin) {
          setCurrentPage('editViews');
        } else {
          console.log('Non-admin user blocked from edit page');
          setCurrentPage('unauthorized');
        }
      } else if (path[2] === 'view-only' && path[3]) {
        // UPDATED: Handle view-only URLs with potential search parameters
        let viewIdFromUrl = path[3];
        
        // Check if the viewId contains search parameters (format: viewId=search+terms)
        if (viewIdFromUrl.includes('=')) {
          // Split at the first = to separate viewId from search terms
          viewIdFromUrl = viewIdFromUrl.split('=')[0];
          console.log('Extracted viewId from URL with search params:', viewIdFromUrl);
        }
        
        setCurrentPage('viewBuilder');
        setCurrentViewId(viewIdFromUrl);
        setIsViewOnly(true);
        console.log('View-only mode activated for view:', viewIdFromUrl);
      } else if (path[2]) {
        if (isAdmin) {
          setCurrentPage('viewBuilder');
          setCurrentViewId(path[2]);
          setIsViewOnly(false);
        } else {
          console.log('Non-admin user blocked from editable view URL');
          setCurrentPage('unauthorized');
        }
      } else {
        setCurrentPage('viewBuilder');
      }
    }
  }, [isAdmin, userEmail]);

  // Function to handle navigation between pages
  const navigate = (page, viewId = '') => {
    if ((page === 'editViews' || (page === 'viewBuilder' && viewId && !isViewOnly)) && !isAdmin) {
      alert('Access denied: You do not have administrator privileges to access this feature.');
      return;
    }

    setCurrentPage(page);
    if (viewId) {
      setCurrentViewId(viewId);
      if (isViewOnly) {
        window.history.pushState({}, '', `/viewBuilderApp/view-only/${viewId}`);
      } else {
        window.history.pushState({}, '', `/viewBuilderApp/${viewId}`);
      }
    } else if (page === 'editViews') {
      window.history.pushState({}, '', '/viewBuilderApp/edit');
    } else {
      window.history.pushState({}, '', '/viewBuilderApp');
    }
  };

  // Handle session expiration
  const handleSessionExpired = () => {
    setSessionExpired(true);
    setFirstLog(false);
  };

  // Show login screen if not authenticated
  if (!firstLog) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <h1 className="mb-4">🧐 View Builder</h1>
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Login Required</h5>
                <p className="card-text mb-4">Please sign in with your Google account to access View Builder.</p>
                <GoogleLogin
                  onSuccess={handleLogin}
                  onError={() => console.log("Login Failed")}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show unauthorized page for blocked access
  if (currentPage === 'unauthorized') {
    return <UnauthorizedAccess />;
  }

  // Render the appropriate component based on current page
  if (currentPage === 'editViews') {
    return (
      <div>
        <div className="container mt-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            {/* <h1>🧐 View Builder - Edit Views</h1> */}
            <h1>🧐 View {currentViewId && viewName ? ` - ${viewName}` : ' - Edit Views'}</h1>
            <div className="d-flex align-items-center">
              <span className="me-3 text-muted">
                Welcome, {userEmail}
                {isAdmin && <span className="badge bg-success ms-2">Admin</span>}
              </span>
              <button 
                className="btn btn-outline-secondary btn-sm" 
                onClick={() => {setFirstLog(false); logout();}}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
        
        {sessionExpired && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-center" 
               style={{backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050}}>
            <div className="bg-white p-4 rounded shadow-lg text-center">
              <h2 className="h5 mb-3">Session Expired</h2>
              <p className="mb-3">Please sign in again to continue.</p>
              <GoogleLogin
                onSuccess={handleLogin}
                onError={() => console.log("Login Failed")}
              />
            </div>
          </div>
        )}
        
        <EditViews onNavigate={navigate} onSessionExpired={handleSessionExpired} />
      </div>
    );
  } else {
    return (
      <div>
        {!isViewOnly && (
          <div className="container mt-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div></div>
              <div className="d-flex align-items-center">
                <span className="me-3 text-muted">
                  Welcome, {userEmail}
                  {isAdmin && <span className="badge bg-success ms-2">Admin</span>}
                  {!isAdmin && <span className="badge bg-warning text-dark ms-2">Read-Only</span>}
                </span>
                <button 
                  className="btn btn-outline-secondary btn-sm" 
                  onClick={() => {setFirstLog(false); logout();}}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
        
        {sessionExpired && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-center" 
               style={{backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050}}>
            <div className="bg-white p-4 rounded shadow-lg text-center">
              <h2 className="h5 mb-3">Session Expired</h2>
              <p className="mb-3">Please sign in again to continue.</p>
              <GoogleLogin
                onSuccess={handleLogin}
                onError={() => console.log("Login Failed")}
              />
            </div>
          </div>
        )}
        
        <ViewBuilder 
          viewId={currentViewId} 
          onNavigate={navigate} 
          isViewOnly={isViewOnly} 
          onSessionExpired={handleSessionExpired}
          isAdmin={isAdmin}
          userEmail={userEmail}
        />
      </div>
    );
  }
}

// Enhanced PaginationControls Component with Jump to Page feature
function PaginationControls({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  startRow, 
  endRow, 
  totalRows 
}) {
  const [jumpToPage, setJumpToPage] = useState('');
  const [showJumpInput, setShowJumpInput] = useState(false);

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, current page range, and last page with ellipsis
      pages.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      if (startPage > 2) {
        pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }
      
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Handle jump to page functionality
  const handleJumpToPage = (e) => {
    e.preventDefault();
    const pageNumber = parseInt(jumpToPage);
    
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber);
      setJumpToPage('');
      setShowJumpInput(false);
    } else {
      alert(`Please enter a page number between 1 and ${totalPages}`);
    }
  };

  // Handle input key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJumpToPage(e);
    } else if (e.key === 'Escape') {
      setJumpToPage('');
      setShowJumpInput(false);
    }
  };

  const pageNumbers = generatePageNumbers();

  return (
    <div className="pagination-container d-flex justify-content-between align-items-center mt-3 mb-3">
      <div className="pagination-info">
        <span className="text-muted">
          Showing {startRow} to {endRow} of {totalRows} rows
        </span>
      </div>
      
      {totalPages > 1 && (
        <div className="d-flex align-items-center gap-3">
          {/* Jump to Page Feature */}
          <div className="jump-to-page-container d-flex align-items-center">
            {!showJumpInput ? (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setShowJumpInput(true)}
                title="Jump to specific page"
              >
                Jump to Page
              </button>
            ) : (
              <form onSubmit={handleJumpToPage} className="d-flex align-items-center gap-2">
                <span className="text-muted small">Go to:</span>
                <input
                  type="number"
                  className="form-control form-control-sm jump-page-input"
                  style={{ width: '80px' }}
                  value={jumpToPage}
                  onChange={(e) => setJumpToPage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onBlur={() => {
                    if (!jumpToPage) {
                      setShowJumpInput(false);
                    }
                  }}
                  placeholder={currentPage.toString()}
                  min="1"
                  max={totalPages}
                  autoFocus
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={!jumpToPage}
                >
                  Go
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setJumpToPage('');
                    setShowJumpInput(false);
                  }}
                >
                  ×
                </button>
              </form>
            )}
            {totalPages > 10 && (
              <span className="text-muted small ms-2">
                (of {totalPages} pages)
              </span>
            )}
          </div>

          {/* Standard Pagination Controls */}
          <nav aria-label="Table pagination">
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
              </li>
              
              {pageNumbers.map((page, index) => (
                <li 
                  key={index} 
                  className={`page-item ${
                    page === currentPage ? 'active' : ''
                  } ${page === '...' ? 'disabled' : ''}`}
                >
                  {page === '...' ? (
                    <span className="page-link">…</span>
                  ) : (
                    <button 
                      className="page-link" 
                      onClick={() => onPageChange(page)}
                    >
                      {page}
                    </button>
                  )}
                </li>
              ))}
              
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}

// ViewBuilder component
function ViewBuilder({ viewId = '', onNavigate, isViewOnly = false, onSessionExpired, isAdmin, userEmail }) {
  const [tableName, setTableName] = useState('');
  const [forms, setForms] = useState([]);
  const [question, setQuestion] = useState('');
  const [rows, setRows] = useState([]);
  const [sql, setSql] = useState('');
  const [savedSql, setSavedSql] = useState('');
  const [showSqlEditor, setShowSqlEditor] = useState(false);
  const [queryTables, setQueryTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewName, setViewName] = useState('');
  const [mappingCache, setMappingCache] = useState({});
  const [mappingLoading, setMappingLoading] = useState({});
  const [hoveredRowIndex, setHoveredRowIndex] = useState(null);
  const [isSharedView, setIsSharedView] = useState(false);
  const [viewCreator, setViewCreator] = useState('');
  const fixedTableRef = useRef(null);
  const scrollableTableRef = useRef(null);
  const [searchText, setSearchText] = useState('');
  const [isFormSelectorOpen, setIsFormSelectorOpen] = useState(false);
  const [customColumnConfig, setCustomColumnConfig] = useState(null);
  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);
  const [isActionButtonsOpen, setIsActionButtonsOpen] = useState(false);
  const [actionButtons, setActionButtons] = useState([]);
  const [columnSettings, setColumnSettings] = useState({
    frozenColumns: [],
    columnWidths: {},
    columnOrder: [],
    allowTextWrap: false,
    hiddenColumns: []
  });

  // Modal state for form
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formModalUrl, setFormModalUrl] = useState('');
  const [formModalTitle, setFormModalTitle] = useState('');
  const [currentFormId, setCurrentFormId] = useState(null); // Track currently open/minimized form ID
  const [storedQueryParams, setStoredQueryParams] = useState(null); // Store query params from initial form open
  const [formModalSessionActive, setFormModalSessionActive] = useState(false); // Track if modal session is active

  // Add these state variables after the existing useState declarations
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  // FIXED: Add state to track if view data has been loaded to prevent premature auto-runs
  const [viewDataLoaded, setViewDataLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Track if user is actively editing
  const [hasRunCustomQuery, setHasRunCustomQuery] = useState(false); // Track if user ran a custom query

  const [showColumnSettingsJson, setShowColumnSettingsJson] = useState(false);
  const [columnSettingsJson, setColumnSettingsJson] = useState('');
  const [importColumnSettingsJson, setImportColumnSettingsJson] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(100); // Fixed at 100 rows per page

  const [urlSearchText, setUrlSearchText] = useState(''); // Store the original search from URL
  const [isSearchRestricted, setIsSearchRestricted] = useState(false);

//   // Function to copy current column settings as JSON
// const handleCopyColumnSettings = () => {
//   const currentSettings = {
//     frozenColumns: columnSettings.frozenColumns,
//     columnWidths: columnSettings.columnWidths,
//     allowTextWrap: columnSettings.allowTextWrap
//   };
  
//   const jsonString = JSON.stringify(currentSettings, null, 2);
//   setColumnSettingsJson(jsonString);
  
//   navigator.clipboard.writeText(jsonString).then(() => {
//     alert('Column settings copied to clipboard!');
//   }).catch(() => {
//     // Fallback - show in modal for manual copy
//     setShowColumnSettingsJson(true);
//   });
// };

const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get all unique column keys from the data
  const allKeys = [...new Set(data.flatMap(row => Object.keys(row)))];
  
  // Helper function to escape CSV values only when necessary
  const escapeCSVValue = (value) => {
    // Handle null/undefined values
    if (value === null || value === undefined) {
      return '';
    }
    
    // Convert to string
    value = String(value);
    
    // Handle dates - remove time component if it's midnight
    if (value.match(/^\d{4}-\d{2}-\d{2}T00:00:00/)) {
      value = value.split('T')[0];
    }
    
    // Only add quotes if the value contains commas, quotes, or newlines
    if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
      // Escape any existing quotes by doubling them
      value = value.replace(/"/g, '""');
      return `"${value}"`;
    }
    
    return value;
  };
  
  // Create CSV header (only quote if column name contains commas/quotes)
  const csvHeader = allKeys.map(key => escapeCSVValue(key)).join(',');
  
  // Create CSV rows
  const csvRows = data.map(row => {
    return allKeys.map(key => escapeCSVValue(row[key])).join(',');
  });
  
  // Combine header and rows
  const csvContent = [csvHeader, ...csvRows].join('\n');
  
  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Fallback for browsers that don't support the download attribute
    const url = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    window.open(url);
  }
};

// 2. Add this function inside your ViewBuilder component to handle the export
const handleExportCSV = () => {
  if (filteredRows.length === 0) {
    alert('No data to export. Please run a query first.');
    return;
  }
  
  // Generate filename: view_name_export_timestamp
  const timestamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const cleanViewName = viewName ? 
    viewName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : 
    'untitled_view';
  const filename = `${cleanViewName}_export_${timestamp}.csv`;
  
  // Show progress indicator
  const originalTitle = document.title;
  document.title = '📥 Exporting...';
  
  try {
    // Use filteredRows to export only the data that matches current search/filters
    exportToCSV(filteredRows, filename);
    
    // Show success message
    setTimeout(() => {
      document.title = originalTitle;
      // Optional: Show a brief success indicator
      const successMsg = document.createElement('div');
      successMsg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 0.75rem 1rem;
        border-radius: 0.25rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 1060;
        font-size: 0.875rem;
        animation: slideInRight 0.3s ease-out;
      `;
      successMsg.textContent = `✓ Exported ${filteredRows.length} rows to ${filename}`;
      document.body.appendChild(successMsg);
      
      setTimeout(() => {
        successMsg.remove();
      }, 3000);
    }, 500);
    
  } catch (error) {
    console.error('Export failed:', error);
    document.title = originalTitle;
    alert('Export failed. Please try again.');
  }
};

// Function to apply imported column settings
// Function to apply imported column settings
const handleApplyColumnSettings = () => {
  if (!importColumnSettingsJson.trim()) {
    alert('Please paste column settings JSON first.');
    return;
  }
  
  try {
    const importedSettings = JSON.parse(importColumnSettingsJson.trim());
    
    if (!importedSettings || typeof importedSettings !== 'object') {
      throw new Error('Invalid settings format');
    }
    
    // Get current data columns
    const currentDataKeys = rows.length > 0 ? Object.keys(rows[0]) : [];
    
    // Merge settings with preference to imported settings
    const mergedSettings = {
      // For frozen columns: merge imported with current (additive approach)
      // Keep currently frozen columns that exist in data, and add imported frozen columns
      frozenColumns: [
        // Keep current frozen columns that still exist in the data or are action columns
        ...columnSettings.frozenColumns.filter(key => 
          currentDataKeys.includes(key) || 
          (customColumnConfig && customColumnConfig.some(col => col.key === key))
        ),
        // Add imported frozen columns that exist in data/config and aren't already included
        ...(importedSettings.frozenColumns || []).filter(key => 
          (currentDataKeys.includes(key) || 
           (customColumnConfig && customColumnConfig.some(col => col.key === key))) &&
          !columnSettings.frozenColumns.includes(key)
        )
      ],
      
      // For column widths: merge imported with current, imported takes precedence
      columnWidths: {
        ...columnSettings.columnWidths,
        ...Object.fromEntries(
          Object.entries(importedSettings.columnWidths || {})
            .filter(([key]) => currentDataKeys.includes(key) || 
              (customColumnConfig && customColumnConfig.some(col => col.key === key)))
        )
      },
      
      // For column order: merge current with imported, preserving existing order and adding new ones
      columnOrder: [
        // Keep current order for columns that still exist
        ...columnSettings.columnOrder.filter(key => 
          currentDataKeys.includes(key) || 
          (customColumnConfig && customColumnConfig.some(col => col.key === key))
        ),
        // Add imported order for columns not already in current order
        ...(importedSettings.columnOrder || []).filter(key => 
          (currentDataKeys.includes(key) || 
           (customColumnConfig && customColumnConfig.some(col => col.key === key))) &&
          !columnSettings.columnOrder.includes(key)
        )
      ],
      
      // Use imported text wrap setting
      allowTextWrap: importedSettings.allowTextWrap || false,
      
      // For hidden columns: merge imported with current (additive approach)
      hiddenColumns: [
        // Keep current hidden columns that still exist in the data
        ...columnSettings.hiddenColumns?.filter(key => 
          currentDataKeys.includes(key) || 
          (customColumnConfig && customColumnConfig.some(col => col.key === key))
        ) || [],
        // Add imported hidden columns that exist in data/config and aren't already included
        ...(importedSettings.hiddenColumns || []).filter(key => 
          (currentDataKeys.includes(key) || 
           (customColumnConfig && customColumnConfig.some(col => col.key === key))) &&
          !(columnSettings.hiddenColumns || []).includes(key)
        )
      ]
    };
        
    setColumnSettings(mergedSettings);
    setImportColumnSettingsJson('');
    alert('Column settings applied successfully!');
    
    console.log('Applied imported column settings:', mergedSettings);
    
  } catch (error) {
    console.error('Error parsing column settings:', error);
    alert('Invalid JSON format. Please check your column settings and try again.');
  }
};
// Function to copy current column settings as JSON
const handleCopyColumnSettings = () => {
  const currentSettings = {
    frozenColumns: columnSettings.frozenColumns,
    columnWidths: columnSettings.columnWidths,
    allowTextWrap: columnSettings.allowTextWrap,
    hiddenColumns: columnSettings.hiddenColumns // ADD THIS LINE
  };
  
  const jsonString = JSON.stringify(currentSettings, null, 2);
  setColumnSettingsJson(jsonString);
  
  navigator.clipboard.writeText(jsonString).then(() => {
    alert('Column settings copied to clipboard!');
  }).catch(() => {
    // Fallback - show in modal for manual copy
    setShowColumnSettingsJson(true);
  });
};

  // Smart sorting function that handles text, numbers, dates, and null values
  const smartSort = (a, b, key, direction) => {
    let aVal = a[key];
    let bVal = b[key];
    
    // Handle null/undefined values - put them at the end
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    
    // Convert to strings for comparison
    aVal = String(aVal).trim();
    bVal = String(bVal).trim();
    
    // Check if both values are numbers
    const aNum = parseFloat(aVal.replace(/[,$%]/g, ''));
    const bNum = parseFloat(bVal.replace(/[,$%]/g, ''));
    const aIsNum = !isNaN(aNum) && isFinite(aNum);
    const bIsNum = !isNaN(bNum) && isFinite(bNum);
    
    let comparison = 0;
    
    if (aIsNum && bIsNum) {
      // Both are numbers
      comparison = aNum - bNum;
    } else if (aIsNum && !bIsNum) {
      // Numbers come before text
      comparison = -1;
    } else if (!aIsNum && bIsNum) {
      // Text comes after numbers
      comparison = 1;
    } else {
      // Both are text - case insensitive comparison
      comparison = aVal.toLowerCase().localeCompare(bVal.toLowerCase());
    }
    
    return direction === 'desc' ? -comparison : comparison;
  };

  // Helper function to intelligently merge column configs and settings
const mergeColumnConfigWithSettings = (newDataKeys, oldCustomColumnConfig, oldColumnSettings) => {
  if (!oldCustomColumnConfig || !newDataKeys.length) {
    return {
      newColumnConfig: null,
      newColumnSettings: {
        frozenColumns: [],
        columnWidths: {},
        columnOrder: [],
        allowTextWrap: false,
        hiddenColumns: [] // ADD THIS LINE
      }
    };
  }

  // Extract action columns (always preserve)
  const actionColumns = oldCustomColumnConfig.filter(col => col.isAction);
  
  // Extract old data columns for reference
  const oldDataColumns = oldCustomColumnConfig.filter(col => !col.isAction);
  const oldDataColumnMap = new Map(oldDataColumns.map(col => [col.key, col]));
  
  // Create new data columns, preserving settings for matching keys
  const newDataColumns = newDataKeys.map(key => {
    const oldColumn = oldDataColumnMap.get(key);
    
    if (oldColumn) {
      // Preserve all settings from old column
      console.log(`Preserving settings for column: ${key}`);
      return {
        ...oldColumn,
        // Ensure it's marked as data column (not action)
        isAction: false
      };
    } else {
      // Create new column with default settings
      console.log(`Creating new column: ${key}`);
      return {
        key,
        label: key.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
        isAction: false,
        category: 'other'
      };
    }
  });
  
  // Combine: new data columns first, then preserved action columns
  const newColumnConfig = [...newDataColumns, ...actionColumns];
  
  // Update column settings - preserve settings for columns that still exist
  const newColumnSettings = {
    frozenColumns: oldColumnSettings.frozenColumns.filter(key => newDataKeys.includes(key)),
    columnWidths: {},
    columnOrder: oldColumnSettings.columnOrder.filter(key => 
      newDataKeys.includes(key) || actionColumns.some(col => col.key === key)
    ),
    allowTextWrap: oldColumnSettings.allowTextWrap,
    hiddenColumns: oldColumnSettings.hiddenColumns?.filter(key => newDataKeys.includes(key)) || [] // ADD THIS LINE
  };
  
  // Preserve column widths for existing columns
  Object.keys(oldColumnSettings.columnWidths).forEach(key => {
    if (newDataKeys.includes(key) || actionColumns.some(col => col.key === key)) {
      newColumnSettings.columnWidths[key] = oldColumnSettings.columnWidths[key];
    }
  });
  
  console.log('Merged column config:', {
    preservedDataColumns: newDataColumns.filter(col => oldDataColumnMap.has(col.key)).map(c => c.key),
    newDataColumns: newDataColumns.filter(col => !oldDataColumnMap.has(col.key)).map(c => c.key),
    preservedActionColumns: actionColumns.map(c => c.key),
    preservedFrozenColumns: newColumnSettings.frozenColumns,
    preservedWidths: Object.keys(newColumnSettings.columnWidths),
    preservedHiddenColumns: newColumnSettings.hiddenColumns // ADD THIS LINE
  });
  
  return {
    newColumnConfig,
    newColumnSettings
  };
};

// Calculate visible columns (exclude hidden columns in view-only mode)
const visibleColumns = useMemo(() => {
  if (!rows.length) return [];
  
  const allColumns = Object.keys(rows[0]);
  const hiddenColumnKeys = new Set(columnSettings.hiddenColumns || []);
  
  // In view-only mode, filter out hidden columns
  if (isViewOnly) {
    return allColumns.filter(key => !hiddenColumnKeys.has(key));
  }
  
  // In edit mode, include all columns
  return allColumns;
}, [rows, columnSettings.hiddenColumns, isViewOnly]);

// Helper function to evaluate search expressions with OR and brackets
const evaluateSearchExpression = (searchExpression, targetString, row = null, columns = null) => {
  // Handle quoted searches first (highest precedence)
  if (searchExpression.startsWith('"') && searchExpression.endsWith('"') && searchExpression.length > 2) {
    const phraseToSearch = searchExpression.slice(1, -1).toLowerCase();
    
    if (targetString !== null) {
      // Column-specific search
      return targetString.includes(phraseToSearch);
    } else {
      // Global search
      return columns.some(key => {
        const value = row[key];
        return value !== null &&
               value !== undefined &&
               String(value).toLowerCase().includes(phraseToSearch);
      });
    }
  }
  
  // Parse brackets and handle complex expressions
  const groups = parseSearchGroups(searchExpression);
  
  // All groups must match (AND logic between groups)
  return groups.every(group => evaluateSearchGroup(group, targetString, row, columns));
};

// Helper function to parse search expression into groups, respecting brackets
const parseSearchGroups = (expression) => {
  const groups = [];
  let current = '';
  let bracketDepth = 0;
  let i = 0;
  
  while (i < expression.length) {
    const char = expression[i];
    
    if (char === '(') {
      if (bracketDepth === 0 && current.trim()) {
        // Save what we have before the bracket as a separate group
        groups.push(current.trim());
        current = '';
      }
      bracketDepth++;
      if (bracketDepth > 1) current += char; // Only add if nested brackets
    } else if (char === ')') {
      bracketDepth--;
      if (bracketDepth === 0) {
        // End of bracket group
        if (current.trim()) {
          groups.push(current.trim());
          current = '';
        }
      } else {
        current += char;
      }
    } else if (bracketDepth === 0 && char === ' ') {
      // Space outside brackets - end of a group
      if (current.trim()) {
        groups.push(current.trim());
        current = '';
      }
    } else {
      current += char;
    }
    
    i++;
  }
  
  // Add any remaining content
  if (current.trim()) {
    groups.push(current.trim());
  }
  
  // If no groups were found, treat the whole expression as one group
  if (groups.length === 0) {
    groups.push(expression.trim());
  }
  
  return groups;
};

// Helper function to evaluate a single search group (handles OR logic)
const evaluateSearchGroup = (group, targetString, row, columns) => {
  // Split by pipe for OR logic
  const orTerms = group.split('|').map(term => term.trim()).filter(term => term.length > 0);
  
  // At least one OR term must match
  return orTerms.some(term => {
    // Handle quotes within OR terms
    if (term.startsWith('"') && term.endsWith('"') && term.length > 2) {
      const phraseToSearch = term.slice(1, -1).toLowerCase();
      
      if (targetString !== null) {
        return targetString.includes(phraseToSearch);
      } else {
        return columns.some(key => {
          const value = row[key];
          return value !== null &&
                 value !== undefined &&
                 String(value).toLowerCase().includes(phraseToSearch);
        });
      }
    } else {
      // Handle unmatched quotes
      const hasUnmatchedQuote = term.startsWith('"') && !term.endsWith('"');
      const finalTerm = hasUnmatchedQuote ? term.substring(1) : term;
      
      // Split by whitespace for AND logic within this OR term
      const andTerms = finalTerm.toLowerCase().split(/\s+/).filter(t => t.length > 0);
      
      // All AND terms must match
      return andTerms.every(andTerm => {
        if (targetString !== null) {
          return targetString.includes(andTerm);
        } else {
          return columns.some(key => {
            const value = row[key];
            return value !== null &&
                   value !== undefined &&
                   String(value).toLowerCase().includes(andTerm);
          });
        }
      });
    }
  });
};

// // Updated filteredRows with column-specific search support
// const filteredRows = useMemo(() => {
//   let result = rows;
  
//   // Apply search filter first
//   if (searchText.trim()) {
//     const trimmedSearch = searchText.trim();
    
//     // Check if this is a column-specific search (contains colon)
//     const colonIndex = trimmedSearch.indexOf(':');
//     const isColumnSpecificSearch = colonIndex > 0;
    
//     if (isColumnSpecificSearch) {
//       // Extract column name and search terms
//       const columnName = trimmedSearch.substring(0, colonIndex).trim();
//       const searchContent = trimmedSearch.substring(colonIndex + 1).trim();
      
//       // Validate that the column exists in the data
//       const columnExists = rows.length > 0 && Object.keys(rows[0]).includes(columnName);
      
//       if (!columnExists) {
//         // If column doesn't exist, show no results and optionally log a warning
//         console.warn(`Column '${columnName}' not found in data. Available columns:`, rows.length > 0 ? Object.keys(rows[0]) : []);
//         return [];
//       }
      
//       if (!searchContent) {
//         // If no search content after colon, return all rows
//         return result;
//       }
      
//       // Apply the same quote and AND logic but only to the specific column
//       const isQuotedSearch = searchContent.startsWith('"') && searchContent.endsWith('"') && searchContent.length > 2;
//       const hasUnmatchedQuote = searchContent.startsWith('"') && !searchContent.endsWith('"');
      
//       if (isQuotedSearch) {
//         // Extract the quoted content and search for exact phrase in specific column
//         const phraseToSearch = searchContent.slice(1, -1).toLowerCase();
        
//         result = result.filter(row => {
//           const value = row[columnName];
//           return value !== null &&
//                  value !== undefined &&
//                  String(value).toLowerCase().includes(phraseToSearch);
//         });
//       } else {
//         // AND logic - split by whitespace and ALL terms must match in the specific column
//         const finalSearchContent = hasUnmatchedQuote ? searchContent.substring(1) : searchContent;
//         const searchTerms = finalSearchContent.toLowerCase().split(/\s+/).filter(term => term.length > 0);
        
//         result = result.filter(row => {
//           const value = row[columnName];
//           if (value === null || value === undefined) return false;
          
//           const valueStr = String(value).toLowerCase();
//           return searchTerms.every(term => valueStr.includes(term));
//         });
//       }
//     } else {
//       // Original global search logic (no colon found)
//       const isQuotedSearch = trimmedSearch.startsWith('"') && trimmedSearch.endsWith('"') && trimmedSearch.length > 2;
//       const hasUnmatchedQuote = trimmedSearch.startsWith('"') && !trimmedSearch.endsWith('"');
      
//       if (isQuotedSearch) {
//         // Extract the quoted content and search for exact phrase
//         const phraseToSearch = trimmedSearch.slice(1, -1).toLowerCase();
        
//         result = result.filter(row =>
//           visibleColumns.some(key => {
//             const value = row[key];
//             return value !== null &&
//                    value !== undefined &&
//                    String(value).toLowerCase().includes(phraseToSearch);
//           })
//         );
//       } else {
//         // AND logic - split by whitespace and ALL terms must match
//         const searchContent = hasUnmatchedQuote ? trimmedSearch.substring(1) : trimmedSearch;
//         const searchTerms = searchContent.toLowerCase().split(/\s+/).filter(term => term.length > 0);
        
//         result = result.filter(row =>
//           searchTerms.every(term =>
//             visibleColumns.some(key => {
//               const value = row[key];
//               return value !== null &&
//                      value !== undefined &&
//                      String(value).toLowerCase().includes(term);
//             })
//           )
//         );
//       }
//     }
//   }
  
//   // Apply sorting if a column is selected
//   if (sortColumn) {
//     result = [...result].sort((a, b) => smartSort(a, b, sortColumn, sortDirection));
//   }
  
//   return result;
// }, [rows, searchText, sortColumn, sortDirection, visibleColumns]);

// Updated filteredRows with OR and brackets support
const filteredRows = useMemo(() => {
  let result = rows;
  
  // Apply search filter first
  if (searchText.trim()) {
    const trimmedSearch = searchText.trim();
    
    // Check if this is a column-specific search (contains colon)
    const colonIndex = trimmedSearch.indexOf(':');
    const isColumnSpecificSearch = colonIndex > 0;
    
    if (isColumnSpecificSearch) {
      // Extract column name and search terms
      const columnName = trimmedSearch.substring(0, colonIndex).trim();
      const searchContent = trimmedSearch.substring(colonIndex + 1).trim();
      
      // Validate that the column exists in the data
      const columnExists = rows.length > 0 && Object.keys(rows[0]).includes(columnName);
      
      if (!columnExists) {
        console.warn(`Column '${columnName}' not found in data. Available columns:`, rows.length > 0 ? Object.keys(rows[0]) : []);
        return [];
      }
      
      if (!searchContent) {
        return result;
      }
      
      // Apply the new search logic to the specific column
      result = result.filter(row => {
        const value = row[columnName];
        if (value === null || value === undefined) return false;
        
        const valueStr = String(value).toLowerCase();
        return evaluateSearchExpression(searchContent, valueStr);
      });
    } else {
      // Global search with new logic
      result = result.filter(row =>
        evaluateSearchExpression(trimmedSearch, null, row, visibleColumns)
      );
    }
  }
  
  // Apply sorting if a column is selected
  if (sortColumn) {
    result = [...result].sort((a, b) => smartSort(a, b, sortColumn, sortDirection));
  }
  
  return result;
}, [rows, searchText, sortColumn, sortDirection, visibleColumns]);

// NEW: Add paginatedRows that takes filtered results and applies pagination
const paginatedRows = useMemo(() => {
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  return filteredRows.slice(startIndex, endIndex);
}, [filteredRows, currentPage, rowsPerPage]);

// NEW: Calculate pagination info
const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
const startRow = filteredRows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
const endRow = Math.min(currentPage * rowsPerPage, filteredRows.length);

  // Handle column header click for sorting
  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      // Same column clicked - toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column clicked - start with ascending
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Sort icon component
  const SortIcon = ({ columnKey }) => {
    if (sortColumn !== columnKey) {
      return <span className="text-muted ms-1" style={{ opacity: 0.3 }}>⇅</span>;
    }
    
    return (
      <span className="text-primary ms-1">
        {sortDirection === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  // Helper function to handle axios errors
  const handleAxiosError = (error) => {
    if (error.response?.status === 401) {
      onSessionExpired();
      return;
    }
    throw error;
  };

  // Updated axios calls to use axiosClient and handle errors
  const makeAuthenticatedRequest = async (requestFn) => {
    try {
      return await requestFn();
    } catch (error) {
      handleAxiosError(error);
    }
  };

    // NEW: Helper function to check if form has set comparators
  const formHasSetComparators = (formConfig) => {
    return formConfig.some(field => 
      field.setComparatorField && field.setComparatorField.trim() !== '' &&
      field.setComparatorValue && field.setComparatorValue.trim() !== ''
    );
  };

  // Helper function to validate search text in restrictive mode
  const validateSearchText = (newSearchText) => {
    if (!isViewOnly || !urlSearchText || !isSearchRestricted) {
      return true; // No restrictions
    }
    
    // In restrictive mode, the search text must start with the URL search text
    return newSearchText.startsWith(urlSearchText);
  };

  // Updated search input change handler
const handleSearchTextChange = (e) => {
  const newSearchText = e.target.value;
  
  if (validateSearchText(newSearchText)) {
    setSearchText(newSearchText);
  } else {
    // Prevent removal of URL search text - reset to minimum allowed
    const minAllowedText = urlSearchText + ' ';
    setSearchText(minAllowedText);
    
    // Optional: Show a brief warning
    console.log('Search restriction: Cannot remove URL search terms');
  }
};
  // FIXED: Fetch view data if viewId exists - with proper state management
  useEffect(() => {
    if (!viewId) {
      setViewDataLoaded(false);
      setHasRunCustomQuery(false); // Reset when no view
      return;
    }
    
    console.log('Fetching view:', viewId, 'View-only mode:', isViewOnly);
    setViewDataLoaded(false); // Reset loaded state
    
    makeAuthenticatedRequest(async () => {
      const r = await axiosClient.get(`api/views/${viewId}`);
      console.log('Received view data:', r.data);
      setViewName(r.data.view_name);
      setTableName(r.data.table_name);
      setQuestion(r.data.query_text);
      
      if (r.data.saved_sql) {
        setSavedSql(r.data.saved_sql);
        setSql(r.data.saved_sql);
      }

      if (r.data.creator) {
        setViewCreator(r.data.creator);
      }

      // Load search restriction setting
      if (r.data.is_search_restricted !== undefined) {
        setIsSearchRestricted(r.data.is_search_restricted);
        console.log('Search restriction setting loaded:', r.data.is_search_restricted);
      }

      setIsSharedView(true);
      
      if (r.data.column_config) {
        try {
          const parsedConfig = JSON.parse(r.data.column_config);
          console.log('Loaded column config:', parsedConfig);
          setCustomColumnConfig(parsedConfig);
        } catch (err) {
          console.error('Error parsing column config:', err);
        }
      }

      if (r.data.column_settings) {
        try {
          const parsedSettings = JSON.parse(r.data.column_settings);
          console.log('Loaded column settings:', parsedSettings);
          setColumnSettings(parsedSettings);
        } catch (err) {
          console.error('Error parsing column settings:', err);
        }
      } else {
        console.log('No column settings found in saved view');
      }

      if (r.data.action_buttons) {
        try {
          const parsedActionButtons = JSON.parse(r.data.action_buttons);
          console.log('Loaded action buttons:', parsedActionButtons);
          setActionButtons(parsedActionButtons);
        } catch (err) {
          console.error('Error parsing action buttons:', err);
        }
      } else {
        console.log('No action buttons found in saved view');
      }

      // FIXED: Mark view data as loaded after everything is set
      setViewDataLoaded(true);
      setHasRunCustomQuery(false); // Reset custom query flag for new view
    });
  }, [viewId, isViewOnly]);

  // FIXED: Auto-run logic - only run when view data is fully loaded and not actively editing
  useEffect(() => {
    console.log('Auto-run check:', { 
      viewId, 
      tableName, 
      question, 
      savedSql: savedSql ? 'exists' : 'none', 
      viewDataLoaded,
      isEditing,
      hasRunCustomQuery
    });
    
    // Don't auto-run if:
    // - No viewId
    // - No tableName 
    // - View data hasn't been loaded yet
    // - User is actively editing
    // - User has already run a custom query in this session
    if (!viewId || !tableName || !viewDataLoaded || isEditing || hasRunCustomQuery) {
      console.log('Skipping auto-run:', { 
        viewId: !!viewId, 
        tableName: !!tableName, 
        viewDataLoaded, 
        isEditing,
        hasRunCustomQuery 
      });
      return;
    }

    // Auto-run saved SQL if it exists, otherwise use ChatGPT query
    if (savedSql) {
      console.log('Running saved SQL directly...');
      handleRunDirectSQL(savedSql);
    } else if (question) {
      console.log('Running ChatGPT query...');
      handleSubmit();
    }
  }, [viewId, tableName, viewDataLoaded]); // FIXED: Removed question, savedSql, and isEditing from dependencies

  // FIXED: Auto-refresh when tab becomes visible - but not when editing
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && rows.length > 0 && !isEditing) {
        console.log('Tab became visible, refreshing data...');
        
        const originalTitle = document.title;
        document.title = '🔄 Refreshing...';
        
        if (savedSql) {
          console.log('Refreshing with saved SQL...');
          handleRunDirectSQL(savedSql);
        } else if (sql) {
          console.log('Refreshing with current SQL...');
          handleRunDirectSQL(sql);
        } else if (question) {
          console.log('Refreshing with ChatGPT query...');
          handleSubmit();
        }
        
        setTimeout(() => {
          document.title = originalTitle;
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [savedSql, sql, question, rows.length, isEditing]);

  // Simplified scroll synchronization that avoids React state issues
  useEffect(() => {
    const fixedTable = fixedTableRef.current;
    const scrollableTable = scrollableTableRef.current;
  
    // Simple check - if we don't have both elements, skip
    if (!fixedTable || !scrollableTable) {
      return;
    }
  
    let isScrolling = false;
  
    const syncScrollDown = () => {
      if (isScrolling) return;
      isScrolling = true;
      scrollableTable.scrollTop = fixedTable.scrollTop;
      setTimeout(() => { isScrolling = false; }, 50);
    };
  
    const syncScrollUp = () => {
      if (isScrolling) return;
      isScrolling = true;
      fixedTable.scrollTop = scrollableTable.scrollTop;
      setTimeout(() => { isScrolling = false; }, 50);
    };
  
    fixedTable.addEventListener('scroll', syncScrollDown);
    scrollableTable.addEventListener('scroll', syncScrollUp);
  
    return () => {
      if (fixedTable) fixedTable.removeEventListener('scroll', syncScrollDown);
      if (scrollableTable) scrollableTable.removeEventListener('scroll', syncScrollUp);
    };
  }); // No dependencies - runs on every render but that's fine for this simple case

  // Fetch all forms
  useEffect(() => {
    const fetchAllForms = async () => {
      try {
        console.log('Fetching all forms from the server...');
        const { data } = await axiosClient.get('api/forms/all-forms');
        
        console.log(`Received ${data.length} forms from server`);
        
        const allForms = Array.isArray(data) ? data.map(form => ({
          ...form,
          tableName: form.tableName || '',
          displayName: `${form.formName} (${form.tableName || 'unknown'})`
        })) : [];

        setForms(allForms);
        
        if (!viewId && actionButtons.length === 0) {
          const contactForm = allForms.find(form => 
            form.formName.toLowerCase().includes('add contact') || 
            form.formName.toLowerCase().includes('create contact') ||
            (form.tableName === 'contacts_fresh' && form.formName.toLowerCase().includes('add'))
          );

          if (contactForm) {
            setActionButtons([{
              id: Date.now().toString(),
              formId: contactForm.formId,
              formName: contactForm.formName,
              buttonText: 'Add New Contact',
              buttonStyle: 'btn-primary',
              enabled: true
            }]);
          }
        }
        
        console.log('All forms loaded successfully');
      } catch (err) {
        console.error('Error fetching all forms:', err);
        handleAxiosError(err);
      }
    };
    
    makeAuthenticatedRequest(fetchAllForms);
    
  }, []);

  // Extract table names from SQL query
  const extractTablesFromSQL = (sqlQuery) => {
    if (!sqlQuery) return [];

    const lowerSQL = sqlQuery.toLowerCase();
    const tablePattern = /(?:from|join)\s+(?:\w+\.)?(\w+)(?:\s|$)/gi;

    const tables = new Set();
    let match;

    while ((match = tablePattern.exec(lowerSQL))) {
      tables.add(match[1]);
    }

    return Array.from(tables);
  };

  // Helper function to replace SQL variables with actual values AT RUNTIME ONLY
const replaceSqlVariables = (sqlQuery, userEmail) => {
  if (!sqlQuery || !userEmail) return sqlQuery;
  
  // Define variable replacements
  const variables = {
    '$username': userEmail,
    '${username}': userEmail,
    '$user': userEmail,
    '${user}': userEmail,
    '$email': userEmail,
    '${email}': userEmail
  };
  
  let modifiedSql = sqlQuery;
  
  // Replace each variable with its value
  Object.entries(variables).forEach(([variable, value]) => {
    // Use global replace with proper escaping for special regex characters
    const escapedVariable = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedVariable, 'gi');
    modifiedSql = modifiedSql.replace(regex, `'${value}'`);
  });
  
  // Log the replacement for debugging
  if (modifiedSql !== sqlQuery) {
    console.log('SQL variables replaced at runtime:');
    console.log('Original (stored):', sqlQuery);
    console.log('Modified (executed):', modifiedSql);
  }
  
  return modifiedSql;
};

  // Original ChatGPT query submission
  // const handleSubmit = async e => {
  //   if (e) e.preventDefault();
  //   setLoading(true);
  //   setError('');
  //   setQueryTables([]);
  //   setIsEditing(false); // Clear editing state when running query
  //   setHasRunCustomQuery(true); // Mark that user ran a custom query
    
  //   makeAuthenticatedRequest(async () => {
  //     const { data } = await axiosClient.post('api/query', { question });
  //     setSql(data.sql);
  //     setRows(data.rows);

  //     const tablesInQuery = extractTablesFromSQL(data.sql);
  //     setQueryTables(tablesInQuery);
  //     console.log('Tables found in query:', tablesInQuery);
      
  //     // UPDATED: Intelligently merge column configs and settings
  //     if (!viewId) {
  //       setCustomColumnConfig(null);
  //       setColumnSettings({
  //         frozenColumns: [],
  //         columnWidths: {},
  //         columnOrder: [],
  //         allowTextWrap: false
  //       });
  //     } else {
  //       // For saved views, preserve settings for matching columns
  //       if (data.sql !== savedSql && customColumnConfig) {
  //         console.log('New ChatGPT query differs from saved SQL, merging column settings');
          
  //         const newDataKeys = Object.keys(data.rows[0] || {});
  //         const { newColumnConfig, newColumnSettings } = mergeColumnConfigWithSettings(
  //           newDataKeys, 
  //           customColumnConfig, 
  //           columnSettings
  //         );
          
  //         setCustomColumnConfig(newColumnConfig);
  //         setColumnSettings(newColumnSettings);
  //       }
  //     }
  //     setLoading(false);
  //   }).catch(err => {
  //     setError(err.response?.data?.error || err.message);
  //     setLoading(false);
  //   });
  // };

  const handleSubmit = async e => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setQueryTables([]);
    setIsEditing(false);
    setHasRunCustomQuery(true);
    
    makeAuthenticatedRequest(async () => {
      const { data } = await axiosClient.post('api/query', { question });
      
      // IMPORTANT: Store the original SQL with variables intact
      const originalSql = data.sql;
      setSql(originalSql); // Store original SQL with variables
      
      // Replace variables only for execution
      const modifiedSql = replaceSqlVariables(originalSql, userEmail);
      
      // Execute the SQL with variables replaced
      let executionResult;
      if (modifiedSql !== originalSql) {
        console.log('Variables detected in ChatGPT-generated SQL, executing with replaced variables');
        executionResult = await axiosClient.post('api/execute-sql', { 
          sql: modifiedSql 
        });
      } else {
        // No variables found, use original results
        executionResult = { data };
      }
      
      setRows(executionResult.data.rows);
  
      const tablesInQuery = extractTablesFromSQL(modifiedSql);
      setQueryTables(tablesInQuery);
      console.log('Tables found in query:', tablesInQuery);
      
      // Handle column configuration merging (existing logic)
      if (!viewId) {
        setCustomColumnConfig(null);
        setColumnSettings({
          frozenColumns: [],
          columnWidths: {},
          columnOrder: [],
          allowTextWrap: false,
          hiddenColumns: []
        });
      } else {
        // Compare original SQL (with variables) to saved SQL for proper config merging
        if (originalSql !== savedSql && customColumnConfig) {
          console.log('New ChatGPT query differs from saved SQL, merging column settings');
          
          const newDataKeys = Object.keys(executionResult.data.rows[0] || {});
          const { newColumnConfig, newColumnSettings } = mergeColumnConfigWithSettings(
            newDataKeys, 
            customColumnConfig, 
            columnSettings
          );
          
          setCustomColumnConfig(newColumnConfig);
          setColumnSettings(newColumnSettings);
        }
      }
      setLoading(false);
    }).catch(err => {
      setError(err.response?.data?.error || err.message);
      setLoading(false);
    });
  };

  // // Function to run SQL directly without ChatGPT
  // const handleRunDirectSQL = async (sqlToRun = sql) => {
  //   setLoading(true);
  //   setError('');
  //   setQueryTables([]);
  //   setIsEditing(false); // Clear editing state when running query
  //   setHasRunCustomQuery(true); // Mark that user ran a custom query
    
  //   makeAuthenticatedRequest(async () => {
  //     const { data } = await axiosClient.post('api/execute-sql', { 
  //       sql: sqlToRun 
  //     });
  //     setRows(data.rows);

  //     const tablesInQuery = extractTablesFromSQL(sqlToRun);
  //     setQueryTables(tablesInQuery);
  //     console.log('Tables found in direct SQL:', tablesInQuery);
      
  //     // UPDATED: Intelligently merge column configs and settings
  //     if (sqlToRun !== savedSql && customColumnConfig) {
  //       console.log('Custom SQL detected, merging column settings');
        
  //       const newDataKeys = Object.keys(data.rows[0] || {});
  //       const { newColumnConfig, newColumnSettings } = mergeColumnConfigWithSettings(
  //         newDataKeys, 
  //         customColumnConfig, 
  //         columnSettings
  //       );
        
  //       setCustomColumnConfig(newColumnConfig);
  //       setColumnSettings(newColumnSettings);
  //     }
      
  //     setLoading(false);
  //   }).catch(err => {
  //     setError(err.response?.data?.error || err.message);
  //     setLoading(false);
  //   });
  // };
  const handleRunDirectSQL = async (sqlToRun = sql) => {
    setLoading(true);
    setError('');
    setQueryTables([]);
    setIsEditing(false);
    setHasRunCustomQuery(true);
    
    // Replace variables ONLY for execution, don't modify the stored SQL
    const modifiedSql = replaceSqlVariables(sqlToRun, userEmail);
    
    makeAuthenticatedRequest(async () => {
      const { data } = await axiosClient.post('api/execute-sql', { 
        sql: modifiedSql 
      });
      setRows(data.rows);
  
      const tablesInQuery = extractTablesFromSQL(modifiedSql);
      setQueryTables(tablesInQuery);
      console.log('Tables found in direct SQL:', tablesInQuery);
      
      // Handle column configuration merging (existing logic)
      // Compare original SQL (with variables) to saved SQL
      if (sqlToRun !== savedSql && customColumnConfig) {
        console.log('Custom SQL detected, merging column settings');
        
        const newDataKeys = Object.keys(data.rows[0] || {});
        const { newColumnConfig, newColumnSettings } = mergeColumnConfigWithSettings(
          newDataKeys, 
          customColumnConfig, 
          columnSettings
        );
        
        setCustomColumnConfig(newColumnConfig);
        setColumnSettings(newColumnSettings);
      }
      
      setLoading(false);
    }).catch(err => {
      setError(err.response?.data?.error || err.message);
      setLoading(false);
    });
  };

  // Toggle SQL editor visibility
  const handleToggleSqlEditor = () => {
    setShowSqlEditor(!showSqlEditor);
  };

  // FIXED: Handle SQL editor changes - set editing state to prevent auto-runs
  const handleSqlChange = (e) => {
    setSql(e.target.value);
    setIsEditing(true); // Mark as editing to prevent auto-runs
    console.log('SQL being edited, preventing auto-runs');
  };

  // Save SQL query independently
  const handleSaveSql = () => {
    setSavedSql(sql);
    setIsEditing(false); // Clear editing state when saving
    alert('SQL query saved! This will be used when the view is loaded.');
  };

  const handleSaveView = async () => {
    if (viewId) {
      makeAuthenticatedRequest(async () => {
        const completeColumnConfig = [...fixedColumns, ...scrollableColumns];
        
        const viewData = {
          viewName: viewName,
          tableName: tableName || 'multiple',
          queryText: question,
          saved_sql: savedSql,
          column_config: JSON.stringify(completeColumnConfig),
          column_settings: JSON.stringify(columnSettings),
          action_buttons: JSON.stringify(actionButtons),
          search_text: searchText,
          is_search_restricted: isSearchRestricted
        };

        const { data } = await axiosClient.put(`api/views/${viewId}`, viewData);
        
        alert('View updated successfully!');
      }).catch(err => {
        alert(err.response?.data?.error || err.message);
      });
    } else {
      const name = window.prompt('Name this view:');
      if (!name) return;
      
      makeAuthenticatedRequest(async () => {
        const completeColumnConfig = [...fixedColumns, ...scrollableColumns];
        
        const viewData = {
          viewName: name,
          tableName: tableName || 'multiple',
          queryText: question,
          saved_sql: savedSql,
          column_config: JSON.stringify(completeColumnConfig),
          column_settings: JSON.stringify(columnSettings),
          action_buttons: JSON.stringify(actionButtons),
          is_search_restricted: isSearchRestricted
        };

        const { data } = await axiosClient.post('api/views', viewData);
        
        const editUrl = data.viewUrl || `https://three.motusnova.com/viewBuilderApp/${data.viewId}`;
        const viewOnlyUrl = editUrl.replace('/viewBuilderApp/', '/viewBuilderApp/view-only/');
        
        const urlMessage = `View saved successfully!\n\nEditable URL (for you):\n${editUrl}\n\nView-Only URL (to share with others):\n${viewOnlyUrl}`;
        
        if (window.confirm(urlMessage + '\n\nClick OK to copy the view-only URL to clipboard, or Cancel to copy the editable URL.')) {
          navigator.clipboard.writeText(viewOnlyUrl).then(() => {
            alert('View-only URL copied to clipboard!');
          }).catch(() => {
            window.prompt('View-Only URL (Copy this to share):', viewOnlyUrl);
          });
        } else {
          navigator.clipboard.writeText(editUrl).then(() => {
            alert('Editable URL copied to clipboard!');
          }).catch(() => {
            window.prompt('Editable URL (Copy this):', editUrl);
          });
        }
      }).catch(err => {
        alert(err.response?.data?.error || err.message);
      });
    }
  };

  // Navigate to the Edit Views page
  const handleEditViews = () => {
    if (!isAdmin) {
      alert('Access denied: You do not have administrator privileges to edit views.');
      return;
    }
    onNavigate('editViews');
  };

  // Open form selector modal
  const handleOpenFormSelector = () => {
    if (forms.length === 0) {
      alert(
        "No forms are available for the tables in your query. Try running a query that includes tables with forms (e.g., contacts_fresh, insurance_fresh)."
      );
    } else {
      setIsFormSelectorOpen(true);
    }
  };

  // Handle form column configuration save
  const handleSaveColumnConfiguration = (updatedColumns) => {
    setCustomColumnConfig(updatedColumns);
  };

  // Handler for action button clicks - UPDATED FOR MODAL
//   const handleActionButtonClick = (actionButton) => {
//     const url = `https://three.motusnova.com/formBuilderApp/form/${actionButton.formId}`;
//     setFormModalUrl(url);
//     setFormModalTitle(actionButton.buttonText || actionButton.formName || 'Form');
//     setIsFormModalOpen(true);
//   };

// MODIFIED: Enhanced handleActionButtonClick function with query parameter persistence
  const handleActionButtonClick = async (actionButton) => {
    try {
      // Get the form config to check for set comparators
      const formResponse = await axiosClient.get(`api/forms/${actionButton.formId}`);
      const formConfig = formResponse.data.config;
      const hasSetComparators = formHasSetComparators(formConfig);
      
      console.log(`[DEBUG] Action button form ${actionButton.formId} has set comparators: ${hasSetComparators}`);
      console.log(`[DEBUG] Current form ID: ${currentFormId}, Form modal session active: ${formModalSessionActive}`);
      
      let finalUrl;
      
      // NEW: Query parameter persistence logic for set comparator forms
      if (hasSetComparators) {
        // Check if we're opening the same form that's already open/minimized
        if (formModalSessionActive && currentFormId === actionButton.formId && storedQueryParams) {
          console.log('[DEBUG] Same form detected via action button, appending stored parameters');
          const baseUrl = `https://three.motusnova.com/formBuilderApp/form/${actionButton.formId}`;
          finalUrl = `${baseUrl}?${storedQueryParams.toString()}`;
        } else {
          // First time opening this form - no additional params for action buttons initially
          finalUrl = `https://three.motusnova.com/formBuilderApp/form/${actionButton.formId}`;
          // Store empty params but set the form ID for future reference
          setStoredQueryParams(new URLSearchParams());
          setCurrentFormId(actionButton.formId);
        }
      } else {
        // For non-set-comparator forms, clear any stored session
        if (currentFormId !== actionButton.formId) {
          setStoredQueryParams(null);
          setCurrentFormId(null);
        }
        finalUrl = `https://three.motusnova.com/formBuilderApp/form/${actionButton.formId}`;
      }
      
      setFormModalUrl(finalUrl);
      setFormModalTitle(actionButton.buttonText || actionButton.formName || 'Form');
      setIsFormModalOpen(true);
      setFormModalSessionActive(true); // Mark session as active
      
      console.log(`[DEBUG] Opening action button form with URL: ${finalUrl}`);
      
    } catch (error) {
      console.error('Error opening action button form:', error);
      alert('Failed to load form. Please try again.');
    }
  };

  // NEW: Enhanced FormModal close handler to properly manage session state
  const handleFormModalClose = () => {
    setIsFormModalOpen(false);
    // Only clear session state when modal is actually closed (not minimized)
    // The FormModal component should call this only on actual close, not minimize
    setFormModalSessionActive(false);
    setCurrentFormId(null);
    setStoredQueryParams(null);
    console.log('[DEBUG] Form modal session ended, cleared stored parameters');

    // Refresh data when modal closes (similar to tab visibility refresh)
    if (rows.length > 0 && !isEditing) {
        console.log('Modal closed, refreshing data...');
        
        const originalTitle = document.title;
        document.title = '🔄 Refreshing...';
        
        if (savedSql) {
        console.log('Refreshing with saved SQL...');
        handleRunDirectSQL(savedSql);
        } else if (sql) {
        console.log('Refreshing with current SQL...');
        handleRunDirectSQL(sql);
        } else if (question) {
        console.log('Refreshing with ChatGPT query...');
        handleSubmit();
        }
        
        setTimeout(() => {
        document.title = originalTitle;
        }, 1000);
    }
  };

  // New handler for opening column configuration modal
  const handleOpenColumnConfig = () => {
    setIsColumnConfigOpen(true);
  };

  // New handler for opening action buttons configuration modal
  const handleOpenActionButtons = () => {
    setIsActionButtonsOpen(true);
  };

  // New handler for saving column settings
  const handleSaveColumnSettings = (newSettings) => {
    setColumnSettings(newSettings);
  };

  // New handler for saving action buttons configuration
  const handleSaveActionButtons = (newActionButtons) => {
    setActionButtons(newActionButtons);
  };

  // Debug effect to monitor column settings changes
  useEffect(() => {
    console.log('Column settings changed:', columnSettings);
    console.log('Custom column config:', customColumnConfig);
    console.log('Action buttons:', actionButtons);
  }, [columnSettings, customColumnConfig, actionButtons]);

  useEffect(() => {
  setCurrentPage(1);
}, [searchText]);

// Add this useEffect after your existing useEffects in the ViewBuilder component
useEffect(() => {
  if (viewName) {
    document.title = `${viewName}`;
  } else {
    document.title = '🧐 ViewBuilder';
  }
  
  // Cleanup function to reset title when component unmounts
  return () => {
    document.title = '🧐 ViewBuilder';
  };
}, [viewName]);

useEffect(() => {
  // Only process URL parameters in view-only mode and when viewId exists
  if (!isViewOnly || !viewId) return;
  
  const currentUrl = window.location.href;
  console.log('Current URL:', currentUrl);
  
  // Check if URL contains search parameters after the viewId
  // Format: /view-only/viewId=search+terms
  const urlPattern = new RegExp(`/view-only/${viewId}=(.+)$`);
  const match = currentUrl.match(urlPattern);
  
  if (match && match[1]) {
    // Extract the search terms and decode them
    const encodedSearchTerms = match[1];
    
    // Replace + with spaces and decode URI components
    const decodedSearchTerms = decodeURIComponent(encodedSearchTerms.replace(/\+/g, ' '));
    
    console.log('URL search terms found:', decodedSearchTerms);
    
    // Set the search text if it's different from current
    // if (decodedSearchTerms !== searchText) {
    //   setSearchText(decodedSearchTerms);
    //   console.log('Search text prefilled from URL:', decodedSearchTerms);
    // }
    // Store the URL search text and set as current search
    setUrlSearchText(decodedSearchTerms);
    
    // Add a single space after the URL search terms
    const searchWithSpace = decodedSearchTerms + ' ';
    setSearchText(searchWithSpace);
    console.log('Search text prefilled from URL with space:', searchWithSpace);
  }
}, [viewId, isViewOnly]); // Only run when viewId or isViewOnly changes

  // Check if patient info columns exist
  const hasPatientInfo = useMemo(() => {
    if (!rows.length) return false;

    const firstRow = rows[0];
    return (
      ('contact_id' in firstRow || 'patient_contact_id' in firstRow) && 
      (firstRow.first_name !== undefined || firstRow.patient_first_name !== undefined) &&
      (firstRow.last_name !== undefined || firstRow.patient_last_name !== undefined)
    );
  }, [rows]);

  // Updated split columns logic with column settings support
  // const { fixedColumns, scrollableColumns } = useMemo(() => {
  //   if (!rows.length) return { fixedColumns: [], scrollableColumns: [] };

  //   const keys = Object.keys(rows[0]);
  //   console.log('All available columns:', keys);
  //   console.log('Current column settings:', columnSettings);

  //   if (customColumnConfig) {
  //     console.log('Using custom column config:', customColumnConfig);
  //     const frozenColumnKeys = new Set(columnSettings.frozenColumns || []);
  //     console.log('Frozen column keys:', Array.from(frozenColumnKeys));
      
  //     const fixed = [];
  //     const scrollable = [];
      
  //     customColumnConfig.forEach(column => {
  //       const columnWithSettings = {
  //         ...column,
  //         width: columnSettings.columnWidths[column.key] || 120,
  //         allowTextWrap: columnSettings.allowTextWrap
  //       };
        
  //       if (frozenColumnKeys.has(column.key)) {
  //         fixed.push(columnWithSettings);
  //         console.log(`Column ${column.key} added to FIXED with width ${columnWithSettings.width}`);
  //       } else {
  //         scrollable.push(columnWithSettings);
  //         console.log(`Column ${column.key} added to SCROLLABLE with width ${columnWithSettings.width}`);
  //       }
  //     });

  //     console.log('Using custom config - Fixed:', fixed.length, 'Scrollable:', scrollable.length);
  //     return { fixedColumns: fixed, scrollableColumns: scrollable };
  //   }

  //   const fixed = [];
  //   const scrollable = [];
    
  //   const categorizeColumn = key => {
  //     const lower = key.toLowerCase();
    
  //     if (lower.includes('doctor') || lower.includes('provider') || lower.includes('physician')) {
  //       return 'doctor';
  //     }
  //     if (lower.includes('patient')) {
  //       return 'patient';
  //     }
  //     if (lower === 'contact_id' || lower === 'patient_contact_id') {
  //       return 'patient';
  //     }
  //     if (lower.includes('appointment') || lower.includes('visit')) return 'appointment';
  //     if (lower.includes('med') || lower.includes('drug') || lower.includes('prescription')) return 'medication';
  //     if (lower.includes('insurance') || lower.includes('coverage')) return 'insurance';
    
  //     return 'other';
  //   };

  //   const frozenColumnKeys = new Set(columnSettings.frozenColumns || []);
  //   console.log('Auto mode - Frozen column keys:', Array.from(frozenColumnKeys));

  //   const createColumnWithSettings = (key, category) => ({
  //     key,
  //     label: key
  //       .split('_')
  //       .map(w => w[0].toUpperCase() + w.slice(1))
  //       .join(' '),
  //     category,
  //     width: columnSettings.columnWidths[key] || (category === 'patient' ? 120 : 150),
  //     allowTextWrap: columnSettings.allowTextWrap
  //   });

  //   if (columnSettings.frozenColumns && columnSettings.frozenColumns.length > 0) {
  //     console.log('Applying custom frozen column settings');
  //     keys.forEach(key => {
  //       const category = categorizeColumn(key);
  //       const column = createColumnWithSettings(key, category);
        
  //       if (frozenColumnKeys.has(key)) {
  //         fixed.push(column);
  //         console.log(`Column ${key} added to FIXED (custom) with width ${column.width}`);
  //       } else {
  //         scrollable.push(column);
  //         console.log(`Column ${key} added to SCROLLABLE (custom) with width ${column.width}`);
  //       }
  //     });
  //   } else {
  //     console.log('No custom frozen columns - putting all in scrollable');
  //     keys.forEach(key => {
  //       const category = categorizeColumn(key);
  //       const column = createColumnWithSettings(key, category);
  //       scrollable.push(column);
  //       console.log(`Column ${key} added to SCROLLABLE (default) with width ${column.width}`);
  //     });
  //   }

  //   console.log('Auto config - Fixed:', fixed.length, 'Scrollable:', scrollable.length);
  //   console.log('Fixed columns:', fixed.map(c => c.key));
  //   console.log('Scrollable columns:', scrollable.map(c => c.key));

  //   return { fixedColumns: fixed, scrollableColumns: scrollable };
  // }, [rows, hasPatientInfo, customColumnConfig, columnSettings]);

  // Updated split columns logic with column settings support and view-only hiding
const { fixedColumns, scrollableColumns } = useMemo(() => {
  if (!rows.length) return { fixedColumns: [], scrollableColumns: [] };

  const keys = Object.keys(rows[0]);
  console.log('All available columns:', keys);
  console.log('Current column settings:', columnSettings);

  if (customColumnConfig) {
    console.log('Using custom column config:', customColumnConfig);
    const frozenColumnKeys = new Set(columnSettings.frozenColumns || []);
    const hiddenColumnKeys = new Set(columnSettings.hiddenColumns || []); // ADD THIS LINE
    console.log('Frozen column keys:', Array.from(frozenColumnKeys));
    console.log('Hidden column keys:', Array.from(hiddenColumnKeys)); // ADD THIS LINE
    
    const fixed = [];
    const scrollable = [];
    
    customColumnConfig.forEach(column => {
      // Filter out hidden columns in view-only mode
      if (isViewOnly && hiddenColumnKeys.has(column.key)) {
        console.log(`Hiding column ${column.key} in view-only mode`);
        return; // Skip this column in view-only mode
      }
      
      const columnWithSettings = {
        ...column,
        width: columnSettings.columnWidths[column.key] || 120,
        allowTextWrap: columnSettings.allowTextWrap
      };
      
      if (frozenColumnKeys.has(column.key)) {
        fixed.push(columnWithSettings);
        console.log(`Column ${column.key} added to FIXED with width ${columnWithSettings.width}`);
      } else {
        scrollable.push(columnWithSettings);
        console.log(`Column ${column.key} added to SCROLLABLE with width ${columnWithSettings.width}`);
      }
    });

    console.log('Using custom config - Fixed:', fixed.length, 'Scrollable:', scrollable.length);
    return { fixedColumns: fixed, scrollableColumns: scrollable };
  }

  const fixed = [];
  const scrollable = [];
  
  const categorizeColumn = key => {
    const lower = key.toLowerCase();
  
    if (lower.includes('doctor') || lower.includes('provider') || lower.includes('physician')) {
      return 'doctor';
    }
    if (lower.includes('patient')) {
      return 'patient';
    }
    if (lower === 'contact_id' || lower === 'patient_contact_id') {
      return 'patient';
    }
    if (lower.includes('appointment') || lower.includes('visit')) return 'appointment';
    if (lower.includes('med') || lower.includes('drug') || lower.includes('prescription')) return 'medication';
    if (lower.includes('insurance') || lower.includes('coverage')) return 'insurance';
  
    return 'other';
  };

  const frozenColumnKeys = new Set(columnSettings.frozenColumns || []);
  const hiddenColumnKeys = new Set(columnSettings.hiddenColumns || []); // ADD THIS LINE
  console.log('Auto mode - Frozen column keys:', Array.from(frozenColumnKeys));
  console.log('Auto mode - Hidden column keys:', Array.from(hiddenColumnKeys)); // ADD THIS LINE

  const createColumnWithSettings = (key, category) => ({
    key,
    label: key
      .split('_')
      .map(w => w[0].toUpperCase() + w.slice(1))
      .join(' '),
    category,
    width: columnSettings.columnWidths[key] || (category === 'patient' ? 120 : 150),
    allowTextWrap: columnSettings.allowTextWrap
  });

  if (columnSettings.frozenColumns && columnSettings.frozenColumns.length > 0) {
    console.log('Applying custom frozen column settings');
    keys.forEach(key => {
      // Filter out hidden columns in view-only mode
      if (isViewOnly && hiddenColumnKeys.has(key)) {
        console.log(`Hiding column ${key} in view-only mode (auto config)`);
        return; // Skip this column in view-only mode
      }
      
      const category = categorizeColumn(key);
      const column = createColumnWithSettings(key, category);
      
      if (frozenColumnKeys.has(key)) {
        fixed.push(column);
        console.log(`Column ${key} added to FIXED (custom) with width ${column.width}`);
      } else {
        scrollable.push(column);
        console.log(`Column ${key} added to SCROLLABLE (custom) with width ${column.width}`);
      }
    });
  } else {
    console.log('No custom frozen columns - putting all in scrollable');
    keys.forEach(key => {
      // Filter out hidden columns in view-only mode
      if (isViewOnly && hiddenColumnKeys.has(key)) {
        console.log(`Hiding column ${key} in view-only mode (default config)`);
        return; // Skip this column in view-only mode
      }
      
      const category = categorizeColumn(key);
      const column = createColumnWithSettings(key, category);
      scrollable.push(column);
      console.log(`Column ${key} added to SCROLLABLE (default) with width ${column.width}`);
    });
  }

  console.log('Auto config - Fixed:', fixed.length, 'Scrollable:', scrollable.length);
  console.log('Fixed columns:', fixed.map(c => c.key));
  console.log('Scrollable columns:', scrollable.map(c => c.key));

  return { fixedColumns: fixed, scrollableColumns: scrollable };
}, [rows, hasPatientInfo, customColumnConfig, columnSettings, isViewOnly]); // ADD isViewOnly to dependencies

  // Helper function to get AI field mapping
  const getAIFieldMapping = async (row, formConfig) => {
    const cacheKey = JSON.stringify({ 
      rowKeys: Object.keys(row), 
      formFields: formConfig.map(f => ({
        inputName: f.inputName || f.name,
        outputName: f.outputName || f.name,
        type: f.type,
        label: f.label
      }))
    });

    if (mappingCache[cacheKey]) {
      return mappingCache[cacheKey];
    }

    try {
      const response = await axiosClient.post('api/map-fields', {
        queryParams: Object.keys(row),
        formFields: formConfig.map(f => ({
          inputName: f.inputName || f.name,
          outputName: f.outputName || f.name,
          type: f.type,
          label: f.label
        }))
      });

      const mapping = response.data.mapping;

      setMappingCache(prev => ({
        ...prev,
        [cacheKey]: mapping
      }));

      return mapping;
    } catch (error) {
      console.error('Error getting AI mapping:', error);
      handleAxiosError(error);
      return {};
    }
  };

  // NEW: Helper function to merge query parameters
  const mergeQueryParams = (storedParams, newParams) => {
    if (!storedParams) return newParams;
    
    const merged = new URLSearchParams();
    
    // Add all stored parameters first
    storedParams.forEach((value, key) => {
      merged.append(key, value);
    });
    
    // Add new parameters (append to allow duplicates for set comparators)
    newParams.forEach((value, key) => {
      merged.append(key, value);
    });
    
    console.log('[DEBUG] Merged query params:', merged.toString());
    return merged;
  };

  // NEW: Helper function to extract table name from field name
  const extractTableNameFromField = (fieldName) => {
    if (!fieldName) return null;
    
    // Extract table name by finding the first underscore
    const parts = fieldName.split('_');
    if (parts.length < 2) return null;
    
    // For patterns like "contacts_fresh_first_name", we want "contacts_fresh"
    // Check if the first two parts form a known table pattern
    const possibleTableName = parts[0] + '_' + parts[1];
    if (possibleTableName.endsWith('_fresh') || possibleTableName.endsWith('_history')) {
      return possibleTableName;
    }
    
    // Otherwise, just return the first part
    return parts[0];
  };

  // NEW: Function to create set comparator based params
  const createSetComparatorParams = (row, formConfig, queryTables) => {
    console.log('Creating set comparator params for row:', row);
    console.log('Form config:', formConfig);
    console.log('Query tables:', queryTables);
    
    const qs = new URLSearchParams();
    
    // Transform all view columns to tableName_columnName format
    Object.entries(row).forEach(([viewColumnName, value]) => {
      if (value === null || value === undefined) return;
      
      // Extract the base column name (remove prefixes like patient_, doctor_)
      let baseColumnName = viewColumnName;
      
      // Remove common prefixes to get the actual database column name
      const prefixesToRemove = ['patient_', 'doctor_', 'insurance_', 'appointment_'];
      for (const prefix of prefixesToRemove) {
        if (baseColumnName.startsWith(prefix)) {
          baseColumnName = baseColumnName.substring(prefix.length);
          break;
        }
      }
      
      console.log(`Processing view column: ${viewColumnName} -> base column: ${baseColumnName}`);
      
      // For each table in the query, create a tableName_columnName parameter
      queryTables.forEach(tableName => {
        const paramName = `${tableName}_${baseColumnName}`;
        
        // Process the value
        let processedValue = value;
        if (typeof value === 'string' && value.includes('T')) {
          // Handle date values
          processedValue = value.split('T')[0];
        }
        
        console.log(`Adding parameter: ${paramName} = ${processedValue}`);
        qs.append(paramName, processedValue); // Use append to allow duplicates
      });
    });
    
    console.log('Final set comparator query string:', qs.toString());
    return qs;
  };

  // Updated createAIMappedParams function with set comparator support
  const createAIMappedParams = async (row, formId, category = 'other') => {
    console.log('Creating mapped params for row:', row, 'category:', category);
  
    const preferPrefixed = (field, prefix) =>
      row[`${prefix}_${field}`] !== undefined ? `${prefix}_${field}` : field;
  
    try {
      const formResponse = await axiosClient.get(`api/forms/${formId}`);
      const formConfig = formResponse.data.config;
      const formTables = formResponse.data.formTables || [];
  
      console.log('Form config loaded:', { formConfig, formTables });
      
      // NEW: Check if form has set comparators
      const hasSetComparators = formHasSetComparators(formConfig);
      console.log('Form has set comparators:', hasSetComparators);
      
      if (hasSetComparators) {
        console.log('Using set comparator mode for form URL generation');
        return createSetComparatorParams(row, formConfig, queryTables);
      }
      
      // Continue with existing AI mapping logic for forms without set comparators
      const mapping = await getAIFieldMapping(row, formConfig);
      console.log('AI mapping result:', mapping);
  
      const qs = new URLSearchParams();
  
      Object.entries(mapping).forEach(([formFieldInputName, rowField]) => {
        const fieldConfig = formConfig.find(f => (f.inputName || f.name) === formFieldInputName);
        
        if (!fieldConfig) {
          console.warn(`Field config not found for: ${formFieldInputName}`);
          return;
        }
  
        if (category === 'doctor' && !rowField.startsWith('doctor_')) {
          const baseFieldName = formFieldInputName.replace(/^(patient_|doctor_)/, '');
          rowField = preferPrefixed(baseFieldName, 'doctor');
        }
        if (category === 'patient' && !rowField.startsWith('patient_')) {
          const baseFieldName = formFieldInputName.replace(/^(patient_|doctor_)/, '');
          rowField = preferPrefixed(baseFieldName, 'patient');
        }
  
        if (row[rowField] !== null && row[rowField] !== undefined) {
          let value = row[rowField];
  
          if (fieldConfig.type === 'date' && value) {
            if (value.includes('T')) value = value.split('T')[0];
            else if (value instanceof Date)
              value = value.toISOString().split('T')[0];
          }
  
          // Auto-add 2 newlines BEFORE existing data for textarea fields
          if (fieldConfig.type === 'textarea' && typeof value === 'string' && value.trim() !== '') {
            value = '\n\n' + value;
            console.log(`Auto-added 2 newlines before existing data in textarea field ${formFieldInputName}: "${value}"`);
          }
  
          const queryParamKey = fieldConfig.inputName || fieldConfig.name;
          qs.set(queryParamKey, value);
          console.log(`AI Mapped ${rowField} -> ${queryParamKey} = ${value}`);
        }
      });
  
      formConfig.forEach(fieldConfig => {
        const formInputName = fieldConfig.inputName || fieldConfig.name;
        
        if (!formInputName || qs.has(formInputName)) {
          return;
        }
        
        // const mappingStrategies = [
        //   formInputName,
        //   formInputName.includes('_') ? formInputName.split('_').slice(1).join('_') : null,
          
        //   // NEW: Strip the full table prefix to get just the column name
        //   // For "story_fresh_destination" -> "destination"
        //   formInputName.includes('_') ? formInputName.split('_').slice(-1)[0] : null,
          
        //   // NEW: Try removing the first two parts (table_fresh_column -> column)
        //   // For "story_fresh_destination" -> "destination" 
        //   (() => {
        //     const parts = formInputName.split('_');
        //     if (parts.length >= 3 && parts[1] === 'fresh') {
        //       return parts.slice(2).join('_');
        //     }
        //     return null;
        //   })(),
          
        //   category === 'doctor' ? formInputName.replace(/^[^_]+_/, 'doctor_') : null,
        //   category === 'patient' ? formInputName.replace(/^[^_]+_/, 'patient_') : null,
        //   formInputName === 'contacts_fresh_contact_id' ? 'contacts_fresh_contact_id' : null,
        //   formInputName === 'contacts_fresh_contact_id' ? 'patient_contact_id' : null,
        //   formInputName === 'contacts_fresh_contact_id' ? 'contact_id' : null,
        //   fieldConfig.outputName,
        //   fieldConfig.name
        // ].filter(Boolean);
        
        // for (const potentialRowKey of mappingStrategies) {
        //   if (row[potentialRowKey] !== null && row[potentialRowKey] !== undefined) {
        //     let value = row[potentialRowKey];
            
        //     if (fieldConfig.type === 'date' && typeof value === 'string') {
        //       if (value.includes('T')) value = value.split('T')[0];
        //       else if (value instanceof Date) value = value.toISOString().split('T')[0];
        //     }
  
        //     // Auto-add 2 newlines BEFORE existing data for textarea fields from strategy mapping
        //     if (fieldConfig.type === 'textarea' && typeof value === 'string' && value.trim() !== '') {
        //       value = '\n\n' + value;
        //       console.log(`Auto-added 2 newlines before existing data in textarea field ${formInputName} (strategy): "${value}"`);
        //     }
            
        //     qs.set(formInputName, value);
        //     console.log(`Strategy mapped ${potentialRowKey} -> ${formInputName} = ${value}`);
        //     break;
        //   }
        // }
      });
  
      Object.entries(row).forEach(([rowKey, value]) => {
        if (value !== null && value !== undefined) {
          const matchingField = formConfig.find(f => (f.inputName || f.name) === rowKey);
          if (matchingField && !qs.has(rowKey)) {
            let v = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)
              ? value.split('T')[0]
              : value;
  
            // Auto-add 2 newlines BEFORE existing data for textarea fields from direct matching
            if (matchingField.type === 'textarea' && typeof v === 'string' && v.trim() !== '') {
              v = '\n\n' + v;
              console.log(`Auto-added 2 newlines before existing data in textarea field ${rowKey} (direct): "${v}"`);
            }
            
            qs.set(rowKey, v);
            console.log(`Direct match ${rowKey} = ${v}`);
          }
        }
      });
  
      console.log('Final query string:', qs.toString());
      return qs;
    } catch (error) {
      console.error('Error creating AI mapped params:', error);
      handleAxiosError(error);
  
      const qs = new URLSearchParams();
      
      try {
        const formResponse = await axiosClient.get(`api/forms/${formId}`);
        const formConfig = formResponse.data.config || [];
        
        formConfig.forEach(fieldConfig => {
          const formInputName = fieldConfig.inputName || fieldConfig.name;
          if (!formInputName) return;
          
          const candidates = [
            formInputName,
            formInputName.includes('_') ? formInputName.split('_').slice(1).join('_') : null,
            fieldConfig.outputName,
            fieldConfig.name
          ].filter(Boolean);
          
          for (const candidate of candidates) {
            if (row[candidate] !== null && row[candidate] !== undefined) {
              let v = typeof row[candidate] === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(row[candidate])
                ? row[candidate].split('T')[0]
                : row[candidate];
  
              // Auto-add 2 newlines BEFORE existing data for textarea fields in fallback scenario
              if (fieldConfig.type === 'textarea' && typeof v === 'string' && v.trim() !== '') {
                v = '\n\n' + v;
                console.log(`Auto-added 2 newlines before existing data in textarea field ${formInputName} (fallback): "${v}"`);
              }
  
              qs.set(formInputName, v);
              break;
            }
          }
        });
      } catch (configError) {
        Object.entries(row).forEach(([k, v]) => {
          if (v !== null && v !== undefined) {
            let processedValue = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)
              ? v.split('T')[0]
              : v;
  
            // Auto-add 2 newlines BEFORE existing data for textarea-like fields in error fallback
            // Since we don't have field config in error case, we'll check if the field name suggests it's a textarea
            if (typeof processedValue === 'string' && processedValue.trim() !== '' && 
                (k.toLowerCase().includes('note') || k.toLowerCase().includes('comment') || 
                 k.toLowerCase().includes('description') || k.toLowerCase().includes('message'))) {
              processedValue = '\n\n' + processedValue;
              console.log(`Auto-added 2 newlines before existing data in potential textarea field ${k} (error fallback): "${processedValue}"`);
            }
  
            qs.set(k, processedValue);
          }
        });
      }
      
      return qs;
    }
  };

//   // Function to open a form with the row data - UPDATED FOR MODAL
//   const handleOpenForm = async (row, formId, rowIndex, category = 'other') => {
//     setMappingLoading(prev => ({ ...prev, [rowIndex]: true }));

//     try {
//       const mappedParams = await createAIMappedParams(row, formId, category);
//       const url = `https://three.motusnova.com/formBuilderApp/form/${formId}?${mappedParams.toString()}`;
      
//       // Get form name for modal title
//       const form = forms.find(f => f.formId === formId);
//       const formTitle = form ? form.formName : 'Form';
      
//       setFormModalUrl(url);
//       setFormModalTitle(formTitle);
//       setIsFormModalOpen(true);
//       setMappingLoading(prev => ({ ...prev, [rowIndex]: false }));
//     } catch (error) {
//       console.error('Error navigating to form:', error);
//       alert('Failed to load form. Please try again.');
//       setMappingLoading(prev => ({ ...prev, [rowIndex]: false }));
//     }
//   };

// MODIFIED: Enhanced handleOpenForm function with query parameter persistence
  const handleOpenForm = async (row, formId, rowIndex, category = 'other') => {
    setMappingLoading(prev => ({ ...prev, [rowIndex]: true }));

    try {
      // First, get the form config to check for set comparators
      const formResponse = await axiosClient.get(`api/forms/${formId}`);
      const formConfig = formResponse.data.config;
      const hasSetComparators = formHasSetComparators(formConfig);
      
      console.log(`[DEBUG] Form ${formId} has set comparators: ${hasSetComparators}`);
      console.log(`[DEBUG] Current form ID: ${currentFormId}, Form modal session active: ${formModalSessionActive}`);
      
      // Generate new query parameters
      const newMappedParams = await createAIMappedParams(row, formId, category);
      
      let finalParams = newMappedParams;
      
      // NEW: Query parameter persistence logic for set comparator forms
      if (hasSetComparators) {
        // Check if we're opening the same form that's already open/minimized
        if (formModalSessionActive && currentFormId === formId && storedQueryParams) {
          console.log('[DEBUG] Same form detected, merging with stored parameters');
          finalParams = mergeQueryParams(storedQueryParams, newMappedParams);
        } else {
          // First time opening this form or different form - store the new params
          console.log('[DEBUG] Storing query parameters for future merging');
          setStoredQueryParams(new URLSearchParams(newMappedParams.toString()));
          setCurrentFormId(formId);
        }
      } else {
        // For non-set-comparator forms, clear any stored session
        if (currentFormId !== formId) {
          setStoredQueryParams(null);
          setCurrentFormId(null);
        }
      }
      
      const url = `https://three.motusnova.com/formBuilderApp/form/${formId}?${finalParams.toString()}`;
      
      // Get form name for modal title
      const form = forms.find(f => f.formId === formId);
      const formTitle = form ? form.formName : 'Form';
      
      setFormModalUrl(url);
      setFormModalTitle(formTitle);
      setIsFormModalOpen(true);
      setFormModalSessionActive(true); // Mark session as active
      
      console.log(`[DEBUG] Opening form with URL: ${url}`);
      console.log(`[DEBUG] Query params length: ${finalParams.toString().length}`);
      
      setMappingLoading(prev => ({ ...prev, [rowIndex]: false }));
    } catch (error) {
      console.error('Error navigating to form:', error);
      alert('Failed to load form. Please try again.');
      setMappingLoading(prev => ({ ...prev, [rowIndex]: false }));
    }
  };

  // // Helper function to format cell values with multi-line support
  // const formatCellValue = (value) => {
  //   if (value === null || value === undefined) return '-';

  //    // NEW: Handle UTC datetime timestamps - convert to local time
  // if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
  //   try {
  //     const date = new Date(value);
  //     if (!isNaN(date.getTime())) {
  //       // Check if it's just a date (time is 00:00:00)
  //       if (value.match(/T00:00:00/)) {
  //         // Just show the date part for date-only fields
  //         return value.split('T')[0];
  //       } else {
  //         // Show local datetime for time-enabled fields
  //         const localDateTime = date.toLocaleString(undefined, {
  //           year: 'numeric',
  //           month: '2-digit',
  //           day: '2-digit',
  //           hour: '2-digit',
  //           minute: '2-digit',
  //           hour12: false // Use 24-hour format, change to true for 12-hour
  //         });
  //         return localDateTime;
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error parsing datetime:', error);
  //     // Fallback to original logic
  //     if (value.includes('T')) return value.split('T')[0];
  //   }
  // }

  //   if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T00:00:00/)) {
  //     return value.split('T')[0];
  //   }
  //   if (typeof value === 'boolean') return value ? '✓' : '✗';
  //   if (typeof value === 'string') {
  //     // Handle URLs
  //     const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[\w.,@?^=%&:/~+#-]*)?$/;
  //     if (urlPattern.test(value) && !value.includes('@')) {
  //       const url = value.startsWith('http') ? value : `https://${value}`;
        
  //       return (
  //         <a 
  //           href={url} 
  //           target="_blank" 
  //           rel="noopener noreferrer" 
  //           title={value}
  //           className="table-link"
  //         >
  //           View
  //         </a>
  //       );
  //     }
  
  //     // Apply width constraints to ALL text content, regardless of length
  //     // Handle multi-line text by replacing newlines with spaces first
  //     const singleLineText = value.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      
  //     // ALWAYS wrap text in constrained container - don't check length
  //     return (
  //       <span 
  //         title={value}
  //         style={{ 
  //           display: 'block',
  //           overflow: 'hidden',
  //           textOverflow: 'ellipsis',
  //           whiteSpace: 'nowrap',
  //           maxWidth: '100%',
  //           width: '100%',
  //           boxSizing: 'border-box'
  //         }}
  //       >
  //         {singleLineText.length > 47 ? `${singleLineText.substring(0, 47)}...` : singleLineText}
  //       </span>
  //     );
  //   }
  //   return (
  //     <span style={{ 
  //       display: 'block',
  //       overflow: 'hidden',
  //       textOverflow: 'ellipsis',
  //       whiteSpace: 'nowrap',
  //       maxWidth: '100%',
  //       width: '100%',
  //       boxSizing: 'border-box'
  //     }}>
  //       {String(value)}
  //     </span>
  //   );
  // };

  // Helper function to format cell values with multi-line support and proper text selection
  const formatCellValue = (value) => {
    if (value === null || value === undefined) return '-';
  
    // Handle UTC datetime timestamps - convert to local time
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          // Check if it's just a date (time is 00:00:00)
          if (value.match(/T00:00:00/)) {
            // Just show the date part for date-only fields
            return value.split('T')[0];
          } else {
            // Show local datetime for time-enabled fields
            const localDateTime = date.toLocaleString(undefined, {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false // Use 24-hour format, change to true for 12-hour
            });
            return localDateTime;
          }
        }
      } catch (error) {
        console.error('Error parsing datetime:', error);
        // Fallback to original logic
        if (value.includes('T')) return value.split('T')[0];
      }
    }
  
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T00:00:00/)) {
      return value.split('T')[0];
    }
    if (typeof value === 'boolean') return value ? '✓' : '✗';
    if (typeof value === 'string') {
      // Handle URLs
      const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[\w.,@?^=%&:/~+#-]*)?$/;
      if (urlPattern.test(value) && !value.includes('@')) {
        const url = value.startsWith('http') ? value : `https://${value}`;
        
        return (
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            title={value}
            className="table-link"
          >
            View
          </a>
        );
      }
  
      // FIXED: Single span approach that allows selection and shows full text on hover
      // Handle multi-line text by replacing newlines with spaces for display
      const singleLineText = value.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      
      return (
        <span
          title={value} // Full text in tooltip
          style={{ 
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
            width: '100%',
            boxSizing: 'border-box',
            userSelect: 'text', // Allow text selection
            cursor: 'text' // Show text cursor
          }}
          // Optional: Double-click to copy full text to clipboard
          onDoubleClick={(e) => {
            try {
              navigator.clipboard.writeText(value);
              
              // Show brief feedback
              const originalTitle = e.target.title;
              e.target.title = 'Copied full text to clipboard!';
              setTimeout(() => {
                e.target.title = originalTitle;
              }, 1500);
            } catch (err) {
              console.log('Clipboard API not available');
            }
          }}
        >
          {singleLineText.length > 47 ? `${singleLineText.substring(0, 47)}...` : singleLineText}
        </span>
      );
    }
    
    return (
      <span style={{ 
        display: 'block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '100%',
        width: '100%',
        boxSizing: 'border-box',
        userSelect: 'text',
        cursor: 'text'
      }}>
        {String(value)}
      </span>
    );
  };

  return (
    <>
      <div className="container mt-3">
        
        {!isViewOnly && !isAdmin && (
          <div className="alert alert-warning mb-3" role="alert">
            <strong>ℹ️ Read-Only Access</strong> - You can view data and use action buttons, but cannot create or edit views. Contact an administrator for edit access.
          </div>
        )}
        
        {/* <h1 className="mb-4">🧐 View Builder</h1> */}
        <h1 className="mb-4">🧐 View {viewName ? ` - ${viewName}` : ''}</h1>

        {!isViewOnly && (<form onSubmit={handleSubmit} className="mb-4">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Ask a question…"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              readOnly={isSharedView || isViewOnly || !isAdmin}
              required
              style={(isSharedView || isViewOnly || !isAdmin) ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {}}
            />
            {!isSharedView && !isViewOnly && isAdmin && (
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? '…running' : 'Run'}
              </button>
            )}
          </div>
        </form>)}

        {!isViewOnly && isAdmin && (
          <div className="mb-4">
            <div className="d-flex align-items-center mb-2">
              <button
                className="btn btn-outline-info btn-sm me-2"
                onClick={handleToggleSqlEditor}
              >
                {showSqlEditor ? 'Hide SQL Editor' : 'Show SQL Editor'}
              </button>
              {showSqlEditor && (
                <>
                  <button
                    className="btn btn-success btn-sm me-2"
                    onClick={() => handleRunDirectSQL()}
                    disabled={loading || !sql.trim()}
                  >
                    {loading ? 'Running...' : 'Run SQL'}
                  </button>
                  <button
                    className="btn btn-warning btn-sm me-2"
                    onClick={handleSaveSql}
                    disabled={!sql.trim()}
                  >
                    Save SQL
                  </button>
                  {customColumnConfig && hasRunCustomQuery && (
                    <button
                      className="btn btn-outline-secondary btn-sm me-2"
                      onClick={() => {
                        // Extract action columns before clearing
                        const actionColumns = customColumnConfig.filter(col => col.isAction);
                        
                        if (actionColumns.length > 0 && rows.length > 0) {
                          // Create new config with current data columns + preserved action columns
                          const newDataColumns = Object.keys(rows[0]).map(key => ({
                            key,
                            label: key.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
                            isAction: false,
                            category: 'other'
                          }));
                          
                          const newConfig = [...newDataColumns, ...actionColumns];
                          setCustomColumnConfig(newConfig);
                          console.log('Reset columns while preserving action columns');
                        } else {
                          setCustomColumnConfig(null);
                          console.log('Manually cleared column config to show dynamic columns');
                        }
                      }}
                      title="Reset data columns while preserving action columns"
                    >
                      Reset Data Columns
                    </button>
                  )}
                </>
              )}
            </div>
            
            {showSqlEditor && (
              <div className="mb-3">
                {customColumnConfig && hasRunCustomQuery && (
                  <div className="alert alert-info alert-dismissible fade show" role="alert">
                    <strong>ℹ️ Column Configuration Active</strong> - This view has saved column settings. 
                    {rows.length === 0 || Object.keys(rows[0] || {}).length === 0 ? (
                      <span className="text-warning"> This might be why you're seeing empty columns.</span>
                    ) : null}
                    <div className="mt-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => {
                          // Extract action columns before clearing
                          const actionColumns = customColumnConfig.filter(col => col.isAction);
                          
                          if (actionColumns.length > 0 && rows.length > 0) {
                            // Create new config with current data columns + preserved action columns
                            const newDataColumns = Object.keys(rows[0]).map(key => ({
                              key,
                              label: key.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
                              isAction: false,
                              category: 'other'
                            }));
                            
                            const newConfig = [...newDataColumns, ...actionColumns];
                            setCustomColumnConfig(newConfig);
                            console.log('Reset data columns while preserving action columns');
                          } else {
                            setCustomColumnConfig(null);
                            console.log('Cleared column config via alert button');
                          }
                        }}
                      >
                        Reset Data Columns
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => {
                          setCustomColumnConfig(null);
                          console.log('Completely cleared all column config including actions');
                        }}
                      >
                        Clear All Columns
                      </button>
                    </div>
                  </div>
                )}
                <textarea
                  className="form-control font-monospace"
                  rows={8}
                  value={sql}
                  onChange={handleSqlChange}
                  placeholder="Enter your SQL query here..."
                  style={{ fontSize: '14px' }}
                />
                {savedSql && (
                  <small className="text-muted">
                    <strong>Saved SQL:</strong> This view will use the saved SQL query when loaded.
                  </small>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mb-3">
          {!isViewOnly && isAdmin && (
            <button
              className="btn btn-info mb-3 me-2"
              onClick={handleEditViews}
            >
              Edit Views
            </button>
          )}

          {sql && !isViewOnly && isAdmin && (
            <button
              className="btn btn-success mb-3 me-2"
              onClick={handleSaveView}
            >
              {viewId ? 'Update View' : 'Save this View'}
            </button>
          )}

          {actionButtons
            .filter(button => button.enabled)
            .map(button => (
              <button
                key={button.id}
                className={`btn ${button.buttonStyle} mb-3 me-2`}
                onClick={() => handleActionButtonClick(button)}
              >
                {button.buttonText}
              </button>
            ))}

            {rows.length > 0 && !isViewOnly && isAdmin && (
              <>
                {forms.length > 0 && (
                  <button
                    className="btn btn-secondary mb-3 me-2"
                    onClick={() => setIsFormSelectorOpen(true)}
                  >
                    Customize Forms
                  </button>
                )}

                <button
                  className="btn btn-outline-secondary mb-3 me-2"
                  onClick={handleOpenColumnConfig}
                >
                  Column Settings
                </button>

                <button
                  className="btn btn-outline-info mb-3 me-2"
                  onClick={handleOpenActionButtons}
                >
                  Action Buttons
                </button>
                {rows.length > 0 && !isViewOnly && isAdmin && (
                    <>
                      {/* NEW: Column Settings Copy/Paste for Admins */}
                      <div className="btn-group mb-3 me-2" role="group">
                        <button
                          className="btn btn-outline-success btn-sm"
                          onClick={handleCopyColumnSettings}
                          title="Copy current column settings as JSON"
                        >
                          📋 Copy Column Settings
                        </button>
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => setShowColumnSettingsJson(!showColumnSettingsJson)}
                          title="Import column settings from JSON"
                        >
                          📥 Import Column Settings
                        </button>
                        <button
                          className="btn btn-success mb-3 me-2"
                          onClick={handleExportCSV}
                          disabled={filteredRows.length === 0}
                          title={`Export ${filteredRows.length} rows to CSV`}
                        >
                          📥 Export CSV ({filteredRows.length} rows)
                        </button>
                      </div>
                    </>
                  )}

                  {/* NEW: Column Settings Import Panel */}
                  {showColumnSettingsJson && !isViewOnly && isAdmin && (
                    <div className="mb-4">
                      <div className="card">
                        <div className="card-header">
                          <h6 className="mb-0">Column Settings Import/Export</h6>
                        </div>
                        <div className="card-body">
                          {columnSettingsJson && (
                            <div className="mb-3">
                              <label className="form-label">Current Column Settings (Copy this JSON):</label>
                              <textarea
                                className="form-control font-monospace"
                                rows={8}
                                value={columnSettingsJson}
                                readOnly
                                style={{ fontSize: '12px' }}
                              />
                              <button
                                className="btn btn-sm btn-outline-secondary mt-2"
                                onClick={() => {
                                  navigator.clipboard.writeText(columnSettingsJson);
                                  alert('Copied to clipboard!');
                                }}
                              >
                                Copy to Clipboard
                              </button>
                            </div>
                          )}
                          
                          <div className="mb-3">
                            <label className="form-label">Paste Column Settings JSON:</label>
                            <textarea
                              className="form-control font-monospace"
                              rows={6}
                              value={importColumnSettingsJson}
                              onChange={(e) => setImportColumnSettingsJson(e.target.value)}
                              placeholder="Paste column settings JSON here..."
                              style={{ fontSize: '12px' }}
                            />
                          </div>
                          
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={handleApplyColumnSettings}
                              disabled={!importColumnSettingsJson.trim()}
                            >
                              Apply Settings
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setShowColumnSettingsJson(false);
                                setColumnSettingsJson('');
                                setImportColumnSettingsJson('');
                              }}
                            >
                              Close
                            </button>
                          </div>
                          
                          <small className="text-muted mt-2 d-block">
                            <strong>Note:</strong> Imported settings will override current settings for matching columns. 
                            Non-matching columns will keep their current settings.
                          </small>
                        </div>
                      </div>
                    </div>
                  )}
              </>
            )}
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {sql && (!isViewOnly && isAdmin) && (
          <div className="mb-3">
            <div className="mb-2">
              <strong>Generated SQL:</strong>
            </div>
            <div className="card">
              <div className="card-body">
                <pre className="mb-0" style={{ 
                  fontSize: '14px', 
                  fontFamily: 'monospace', 
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-word',
                  backgroundColor: '#f8f9fa',
                  padding: '12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {sql}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {rows.length > 0 && (
        // <div className="container-fluid mx-1 mt-3" style={{ maxWidth: 'none', width: '100vw', overflowX: 'visible' }}>
        //   <div className="input-group mb-4">
        //     <span className="input-group-text">Search</span>
        //     <input
        //       type="text"
        //       className="form-control"
        //       placeholder="Type to filter results…"
        //       value={searchText}
        //       onChange={e => setSearchText(e.target.value)}
        //     />
        //     {searchText && (
        //       <button
        //         className="btn btn-outline-secondary"
        //         onClick={() => setSearchText('')}
        //       >
        //         Clear
        //       </button>
        //     )}
        //   </div>
        <div className="container-fluid mx-1 mt-3" style={{ maxWidth: 'none', width: '100vw', overflowX: 'visible' }}>
    <div className="row align-items-center mb-4">
      <div className="col">
        <div className="input-group">
          <span className="input-group-text">Search</span>
          <input
            type="text"
            className="form-control"
            placeholder={
              isViewOnly && urlSearchText && isSearchRestricted 
                ? `Type to add to "${urlSearchText}"...`
                : "Type to filter results…"
            }
            value={searchText}
            onChange={handleSearchTextChange}
          />
          {searchText && (
            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                if (isViewOnly && urlSearchText && isSearchRestricted) {
                  // In restrictive mode, only clear to the minimum (URL text + space)
                  setSearchText(urlSearchText + ' ');
                } else {
                  // Normal clear
                  setSearchText('');
                }
              }}
            >
              Clear
            </button>
          )}
        </div>
        
        {/* Show restriction status in view-only mode */}
        {/* {isViewOnly && urlSearchText && (
          <small className={`text-${isSearchRestricted ? 'warning' : 'muted'} mt-1 d-block`}>
            {isSearchRestricted 
              ? `🔒 Search restricted: Must include "${urlSearchText}"`
              : `ℹ️ URL search: "${urlSearchText}" (can be modified)`
            }
          </small>
        )} */}
      </div>
      
      {/* Admin control for search restriction toggle */}
      {!isViewOnly && isAdmin && viewId && (
        <div className="col-auto">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="searchRestrictionToggle"
              checked={isSearchRestricted}
              onChange={(e) => setIsSearchRestricted(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="searchRestrictionToggle">
            <small className="text-nowrap">Restrict search </small>
            </label>
          </div>
        </div>
      )}
    </div>

          {rows.length > 0 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                startRow={startRow}
                endRow={endRow}
                totalRows={filteredRows.length}
              />
            )}
          <div 
            className={`split-table-container ${fixedColumns.length === 0 ? 'no-fixed-columns' : ''}`}
            style={{ 
              width: '100%', 
              maxWidth: 'none',
              overflowX: fixedColumns.length === 0 ? 'auto' : 'hidden'
            }}
          >
            {fixedColumns.length > 0 && (
              <div className="fixed-columns-container" ref={fixedTableRef}>
                <table className="table table-bordered table-hover table-sm table-striped fixed-columns-table">
                  {/* <thead className="thead-dark sticky-top">
                    <tr>
                      {fixedColumns.map(col => (
                        <th 
                          key={col.key} 
                          className="text-nowrap fixed-column"
                          style={{ 
                            width: `${col.width}px`,
                            minWidth: `${col.width}px`,
                            maxWidth: `${col.width}px`
                          }}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead> */}
                  <thead className="thead-dark sticky-top">
                    <tr>
                      {fixedColumns.map(col => (
                        <th 
                          key={col.key} 
                          className={`text-nowrap fixed-column ${!col.isAction ? 'user-select-none' : ''}`}
                          style={{ 
                            width: `${col.width}px`,
                            minWidth: `${col.width}px`,
                            maxWidth: `${col.width}px`,
                            cursor: !col.isAction ? 'pointer' : 'default'
                          }}
                          onClick={!col.isAction ? () => handleSort(col.key) : undefined}
                          title={!col.isAction ? 'Click to sort' : ''}
                        >
                          <div className="d-flex align-items-center justify-content-between">
                            <span>{col.label}</span>
                            {!col.isAction && <SortIcon columnKey={col.key} />}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                    <tbody>
                      {paginatedRows.map((row, paginatedIdx) => {
                        const actualIdx = (currentPage - 1) * rowsPerPage + paginatedIdx; // Calculate actual row index
                        return (
                          <tr 
                            key={actualIdx}
                            className={hoveredRowIndex === actualIdx ? 'highlighted-row' : ''}
                            onMouseEnter={() => setHoveredRowIndex(actualIdx)}
                            onMouseLeave={() => setHoveredRowIndex(null)}
                          >
                            {/* Rest of the row content remains the same, but use actualIdx for mapping operations */}
                            {fixedColumns.map(col => (
                              <td 
                                key={col.key}
                                className="fixed-column"
                                style={{ 
                                  width: `${col.width}px`,
                                  minWidth: `${col.width}px`,
                                  maxWidth: `${col.width}px`,
                                  whiteSpace: col.allowTextWrap ? 'normal' : 'nowrap',
                                  wordWrap: col.allowTextWrap ? 'break-word' : 'normal'
                                }}
                              >
                                {col.isAction ? (
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    disabled={mappingLoading[actualIdx]} // Use actualIdx here
                                    onClick={() => handleOpenForm(row, col.formId, actualIdx, col.category)} // Use actualIdx here
                                  >
                                    {mappingLoading[actualIdx] ? 'Loading...' : 'Edit'}
                                  </button>
                                ) : (
                                  formatCellValue(row[col.key])
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                </table>
              </div>
            )}

            <div 
              className="scrollable-columns-container" 
              ref={scrollableTableRef}
              style={{
                width: '100%',
                maxWidth: 'none',
                overflowX: 'auto',
                overflowY: 'auto'
              }}
            >
              <table 
                className="table table-bordered table-hover table-sm table-striped scrollable-columns-table"
                style={{
                  width: 'max-content',
                  minWidth: '100%',
                  tableLayout: 'auto'
                }}
              >
                {/* <thead className="thead-dark sticky-top">
                  <tr>
                    {scrollableColumns.map((col, index) => {
                      return (
                        <th 
                          key={col.key} 
                          className={`text-nowrap ${col.isAction ? 'action-column' : ''}`}
                          style={{ 
                            minWidth: col.isAction ? '150px' : `${col.width || 150}px`,
                            whiteSpace: col.allowTextWrap ? 'normal' : 'nowrap',
                            padding: '0.25rem 0.5rem'
                          }}
                        >
                          {col.label}
                        </th>
                      );
                    })}
                  </tr>
                </thead> */}
                <thead className="thead-dark sticky-top">
                  <tr>
                    {scrollableColumns.map((col, index) => {
                      return (
                        <th 
                          key={col.key} 
                          className={`text-nowrap ${col.isAction ? 'action-column' : 'user-select-none'}`}
                          style={{
                            width: col.isAction ? '150px' : `${col.width || 150}px`,  
                            minWidth: col.isAction ? '150px' : `${col.width || 150}px`,
                            maxWidth: col.isAction ? '150px' : `${col.width || 150}px`,
                            whiteSpace: col.allowTextWrap ? 'normal' : 'nowrap',
                            padding: '0.25rem 0.5rem',
                            cursor: !col.isAction ? 'pointer' : 'default'
                          }}
                          onClick={!col.isAction ? () => handleSort(col.key) : undefined}
                          title={!col.isAction ? 'Click to sort' : ''}
                        >
                          <div className="d-flex align-items-center justify-content-between">
                            <span>{col.label}</span>
                            {!col.isAction && <SortIcon columnKey={col.key} />}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                  <tbody>
                    {paginatedRows.map((row, paginatedIdx) => {
                      const actualIdx = (currentPage - 1) * rowsPerPage + paginatedIdx;
                      return (
                        <tr 
                          key={actualIdx}
                          className={hoveredRowIndex === actualIdx ? 'highlighted-row' : ''}
                          onMouseEnter={() => setHoveredRowIndex(actualIdx)}
                          onMouseLeave={() => setHoveredRowIndex(null)}
                        >
                          {scrollableColumns.map((col) => {
                            return (
                              <td 
                                key={col.key}
                                className={col.isAction ? 'action-column' : ''}
                                style={{
                                  width: col.isAction ? '150px' : `${col.width || 150}px`, 
                                  minWidth: col.isAction ? '150px' : `${col.width || 150}px`,
                                  maxWidth: col.isAction ? '150px' : `${col.width || 150}px`,
                                  padding: '0.25rem 0.5rem',
                                  whiteSpace: col.allowTextWrap ? 'normal' : 'nowrap',
                                  wordWrap: col.allowTextWrap ? 'break-word' : 'normal'
                                }}
                              >
                                {col.isAction ? (
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    disabled={mappingLoading[actualIdx]}
                                    onClick={() => handleOpenForm(row, col.formId, actualIdx, col.category)}
                                  >
                                    {mappingLoading[actualIdx] ? 'Loading...' : 'Edit'}
                                  </button>
                                ) : (
                                  formatCellValue(row[col.key])
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
              </table>
            </div>
          </div>

          {filteredRows.length > 0 && paginatedRows.length === 0 && (
              <p className="text-muted">No results on this page. Try a different page or adjust your search.</p>
            )}
        </div>
      )}
      {rows.length > 0 && (
        <div className="container-fluid mx-1">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            startRow={startRow}
            endRow={endRow}
            totalRows={filteredRows.length}
          />
        </div>
      )}

      {/* Form Modal */}
      <FormModal
    isOpen={isFormModalOpen}
    onClose={handleFormModalClose}
    formUrl={formModalUrl}
    formTitle={formModalTitle}
  />

      {!isViewOnly && isAdmin && (
        <>
          <FormSelectorModal
            isOpen={isFormSelectorOpen}
            onClose={() => setIsFormSelectorOpen(false)}
            availableForms={forms}
            activeColumns={[...fixedColumns, ...scrollableColumns]}
            onSaveColumnConfiguration={handleSaveColumnConfiguration}
          />

          <ColumnConfigModal
            isOpen={isColumnConfigOpen}
            onClose={() => setIsColumnConfigOpen(false)}
            availableColumns={rows.length > 0 ? Object.keys(rows[0]) : []}
            actionColumns={[...fixedColumns, ...scrollableColumns].filter(col => col.isAction)}
            currentSettings={columnSettings}
            onSaveSettings={handleSaveColumnSettings}
          />

          <ActionButtonsModal
            isOpen={isActionButtonsOpen}
            onClose={() => setIsActionButtonsOpen(false)}
            availableForms={forms}
            currentActionButtons={actionButtons}
            onSaveActionButtons={handleSaveActionButtons}
          />
        </>
      )}
    </>
  );
}

export default App;