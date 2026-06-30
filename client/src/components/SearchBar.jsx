import { Search } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export default function SearchBar() {
  const { search, setSearch } = useApp();
  return (
    <label className="searchBar">
      <Search size={16} />
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search project or date" />
    </label>
  );
}
