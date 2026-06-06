import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "@/components/Layout/Header";
import Home from "@/pages/Home";
import CardAtlas from "@/pages/CardAtlas";
import MyCollection from "@/pages/MyCollection";
import Wishlist from "@/pages/Wishlist";
import TradeMatch from "@/pages/TradeMatch";
import Chat from "@/pages/Chat";
import DeckCheck from "@/pages/DeckCheck";
import Profile from "@/pages/Profile";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-surface text-gray-100">
        <Header />
        <main className="pt-20 pb-8 px-4 md:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/atlas" element={<CardAtlas />} />
            <Route path="/collection" element={<MyCollection />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/match" element={<TradeMatch />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/deck" element={<DeckCheck />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
