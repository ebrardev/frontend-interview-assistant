import Chat from "@/components/Chat";


export default function Home() {
  return (
    <div className="App">
    <header className="App-header">
       {/* align center */}
      <h1 style={{ textAlign: 'center', color:"#4c1e7d", padding:"25px", marginTop:"20px" }}>Frontend Assistant</h1>
    </header>
    <main>
      <Chat />
    </main>
  </div>
  )
}
