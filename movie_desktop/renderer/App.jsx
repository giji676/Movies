import { useState } from 'react';
import Search from './Search';

function App() {
    return (
        <div>
            <h1 style={{ textAlign: 'center', marginTop: '2rem' }}>Movie Search App</h1>
            <Search />
        </div>
    );
}

export default App;
