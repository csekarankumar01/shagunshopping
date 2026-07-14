import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="container-page flex flex-col items-center py-24 text-center">
    <p className="font-display text-7xl font-bold italic text-blush">404</p>
    <h1 className="font-display mt-2 text-3xl font-semibold">This page has sold out</h1>
    <p className="mt-2 max-w-sm text-sm text-muted">
      The page you're looking for doesn't exist. The good stuff is still on the shelves, though.
    </p>
    <Link to="/shop" className="btn-primary mt-6">Back to the shop</Link>
  </div>
);

export default NotFound;
