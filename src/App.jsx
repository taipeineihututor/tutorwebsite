import React from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Teachers from './pages/Teachers';
import TeacherForm from './pages/TeacherForm';
import JobForm from './pages/JobForm';
import Admin from './pages/Admin';
import Legal from './pages/Legal';
import School from './pages/School';
import { useRoute } from './lib/router';

export default function App() {
  const route = useRoute();

  let page;
  switch (route) {
    case '/teachers':
      page = <Teachers />;
      break;
    case '/join':
      page = <TeacherForm />;
      break;
    case '/post-job':
      page = <JobForm />;
      break;
    case '/legal':
    case '/terms':
    case '/privacy':
      page = <Legal />;
      break;
    case '/school':
      page = <School />;
      break;
    case '/admin':
      page = <Admin />;
      break;
    default:
      page = <Home />;
  }

  return <Layout route={route}>{page}</Layout>;
}
