import Sidebar from './Sidebar';
import TopBar from './TopBar';

const Layout = ({ title, children }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <TopBar title={title} />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
