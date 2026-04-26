import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";
import { io } from "socket.io-client";

export default function RFQDetails() {
  const { id } = useParams();

  const [rfq, setRfq] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [status, setStatus] = useState("LOADING");
  const [logs, setLogs] = useState([]);

  const [quote, setQuote] = useState({
    carrierName: "",
    freightCharges: "",
    originCharges: "",
    destinationCharges: "",
    transitTime: "",
    validity: "",
  });

  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    const socket = io("http://192.168.31.199:5000");

    fetchRFQ();
    fetchLogs();

    socket.emit("join_rfq", id);

    socket.on("bid_update", () => {
      fetchRFQ();
      fetchLogs();
    });

    const interval = setInterval(() => {
      fetchRFQ();
    }, 5000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [id]);

  useEffect(() => {
    if (!rfq) return;

    const updateTime = () => {
      const now = new Date();
      const start = new Date(rfq.bidStartTime);
      const close = new Date(rfq.bidCloseTime);
      const forced = new Date(rfq.forcedCloseTime);

      if (now < start) {
        setStatus("NOT_STARTED");
        const diff = start - now;
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`Starts in ${mins}m ${secs}s`);
        return;
      }

      if (now >= start && now <= close) {
        setStatus("ACTIVE");
        const diff = close - now;
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}m ${secs}s`);
        return;
      }
      if (now > forced) {
        setStatus("FORCE_CLOSED");
        setTimeLeft("Closed");
        return;
      }

      setStatus("CLOSED");
      setTimeLeft("Closed");
    };

    updateTime();

    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [rfq]);

  const fetchRFQ = async () => {
    try {
      const res = await API.get(`/rfq/${id}`);
      setRfq(res.data.data);
    } catch {
      alert("Error fetching RFQ");
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await API.get(`/logs/${id}`);
      setLogs(res.data.data);
    } catch {
      alert("Error fetching logs");
    }
  };

  const placeBid = async () => {
    if (!quote.carrierName || !quote.freightCharges) {
      return alert("Fill required fields");
    }

    try {
      await API.post("/bid", {
        rfqId: id,
        ...quote,
      });

      setQuote({
        carrierName: "",
        freightCharges: "",
        originCharges: "",
        destinationCharges: "",
        transitTime: "",
        validity: "",
      });
    } catch (err) {
      alert(err.response?.data?.message || "Error placing quote");
    }
  };

  if (!rfq) return <p>Loading...</p>;

  return (
    <div className="container">

      <div className="header">
        <h2>{rfq.name}</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div className="card">
        <p>
          <b>Status:</b>{" "}
          <span style={{ fontWeight: "bold" }}>
            {status === "NOT_STARTED" && "Not Started"}
            {status === "ACTIVE" && "Active"}
            {status === "CLOSED" && "Closed"}
            {status === "FORCE_CLOSED" && "Force Closed"}
          </span>
        </p>

        <p><b>Time Left:</b> {timeLeft}</p>

        <p>
          <b>Lowest Quote:</b>{" "}
          ₹{rfq.bids?.[0]?.totalAmount || "No quotes yet"}
        </p>

        <hr />

        <p><b>Trigger Window:</b> {rfq.triggerWindow} mins</p>
        <p><b>Extension Duration:</b> {rfq.extensionDuration} mins</p>
        <p><b>Extension Type:</b> {rfq.extensionType}</p>
      </div>

      <div className="card">
        <h3>Auction Timeline</h3>
        <p><b>Start:</b> {formatDate(rfq.bidStartTime)}</p>
        <p><b>Current Close Time:</b> {formatDate(rfq.bidCloseTime)}</p>
        
        <p><b>Forced Close:</b> {formatDate(rfq.forcedCloseTime)}</p>

      </div>

      <h3>Live Quotes</h3>

      {rfq.bids?.map((b, index) => (
        <div key={b.id} className={`card ${index === 0 ? "l1" : ""}`}>
          <h2>₹{b.totalAmount}</h2>

          <p><b>{b.rank}</b></p>
          <p>Carrier: {b.carrierName}</p>
          <p>Transit: {b.transitTime}</p>
          <p>Validity: {b.validity}</p>
        </div>
      ))}

      {role === "SUPPLIER" && status === "ACTIVE" && (
        <div className="card">
          <h3>Submit Quote</h3>

          <input
            placeholder="Carrier Name"
            value={quote.carrierName}
            onChange={(e) => setQuote({ ...quote, carrierName: e.target.value })}
          />

          <input
            placeholder="Freight Charges"
            value={quote.freightCharges}
            onChange={(e) => setQuote({ ...quote, freightCharges: e.target.value })}
          />

          <input
            placeholder="Origin Charges"
            value={quote.originCharges}
            onChange={(e) => setQuote({ ...quote, originCharges: e.target.value })}
          />

          <input
            placeholder="Destination Charges"
            value={quote.destinationCharges}
            onChange={(e) => setQuote({ ...quote, destinationCharges: e.target.value })}
          />

          <input
            placeholder="Transit Time"
            value={quote.transitTime}
            onChange={(e) => setQuote({ ...quote, transitTime: e.target.value })}
          />

          <input
            placeholder="Validity"
            value={quote.validity}
            onChange={(e) => setQuote({ ...quote, validity: e.target.value })}
          />

          <button onClick={placeBid}>Submit Quote</button>
        </div>
      )}

      <h3>Activity Logs</h3>

      {logs.length === 0 && <p>No activity yet</p>}

      {logs.map((log) => (
        <div key={log.id} className="card">

          <p>
            <b>{log.type}</b>
          </p>

          <p>{log.message}</p>

          <p style={{ fontSize: "12px", color: "gray" }}>
            {new Date(log.createdAt).toLocaleString()}
          </p>

        </div>
      ))}

    </div>
  );
}