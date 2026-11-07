import React from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Teachers from './pages/Teachers';
import TeacherForm from './pages/TeacherForm';
import JobForm from './pages/JobForm';
import Admin from './pages/Admin';
import Legal from './pages/Legal';
import School from './pages/School';
import Teacher from './pages/Teacher';
import { useRoute } from './lib/router';
import { teacher, onPasswordRecovery } from './lib/api';
import { ResetPassword } from './components/ui';

export default function App() {
  const route = useRoute();
  // A signed-in teacher counts as active whenever they open the site.
  React.useEffect(() => { teacher.session().catch(() => {}); }, []);

  // Someone who followed the link in a "reset password" email.
  const [recovering, setRecovering] = React.useState(false);
  React.useEffect(() => onPasswordRecovery(() => setRecovering(true)), []);

  let page;
  if (recovering) {
    page = <ResetPassword onDone={() => { setRecovering(false); window.location.hash = '#/teacher'; window.location.reload(); }} />;
    return <Layout route={route}>{page}</Layout>;
  }
  if (route.startsWith('/edit-job/')) {
    return <Layout route={route}><JobForm key={route} editId={route.slice('/edit-job/'.length)} /></Layout>;
  }
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
    case '/teacher':
      page = <Teacher />;
      break;
    case '/teacher/edit':
      page = <TeacherForm editing />;
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
