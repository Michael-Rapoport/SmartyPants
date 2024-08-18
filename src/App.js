import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import SearchResults from './components/SearchResults';
import UserProfile from './components/UserProfile';
import Notifications from './components/Notifications';
import AdminDashboard from './components/AdminDashboard';
import Collaboration from './components/Collaboration';
import Login from './components/Login';
import Register from './components/Register';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import api from './services/api';

function PrivateRoute({ component: Component, ...rest }) {
  const { user } = useAuth();
  return (
    <Route
      {...rest}
      render={props =>
        user ? <Component {...props} /> : <Redirect to="/login" />
      }
    />
  );
}

function AdminRoute({ component: Component, ...rest }) {
  const { user } = useAuth();
  return (
    <Route
      {...rest}
      render={props =>
        user && user.isAdmin ? <Component {...props} /> : <Redirect to="/" />
      }
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <Switch>
            <Route exact path="/" component={Home} />
            <Route path="/search" component={SearchResults} />
            <PrivateRoute path="/profile" component={UserProfile} />
            <PrivateRoute path="/notifications" component={Notifications} />
            <AdminRoute path="/admin" component={AdminDashboard} />
            <PrivateRoute path="/collaborate" component={Collaboration} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
          </Switch>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
