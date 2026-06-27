function SearchBar({ placeholder = "🔍 Search anything..." }) {
  return (
    <div className="search-container">
      <input
        type="text"
        className="search-box"
        placeholder={placeholder}
      />
    </div>
  );
}

export default SearchBar;