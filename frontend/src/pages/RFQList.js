import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function RFQList() {
  const [rfqs, setRfqs] = useState([]);

  const [form, setForm] = useState({
    name: "",
    bidStartTime: "",
    bidCloseTime: "",
    forcedCloseTime: "",
    pickupDate: "",
    triggerWindow: 10,
    extensionDuration: 5,
    extensionType: "ANY_BID",
  });

  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  useEffect(() => {
    fetchRFQs();
  }, []);

  const fetchRFQs = async () => {
    try {
      const res = await API.get("/rfq");
      setRfqs(res.data.data || []);
    } catch {
      alert("Error fetching RFQs");
    }
  };

  const createRFQ = async () => {
    try {
      if (
        !form.name ||
        !form.bidStartTime ||
        !form.bidCloseTime ||
        !form.forcedCloseTime ||
        !form.pickupDate
      ) {
        return alert("Please fill all required fields");
      }

      if (form.triggerWindow <= 0 || form.extensionDuration <= 0) {
        return alert("Trigger window and extension must be positive");
      }

      await API.post("/rfq", {
        ...form,
        bidStartTime: new Date(form.bidStartTime),
        bidCloseTime: new Date(form.bidCloseTime),
        forcedCloseTime: new Date(form.forcedCloseTime),
        pickupDate: new Date(form.pickupDate),
      });

      setForm({
        name: "",
        bidStartTime: "",
        bidCloseTime: "",
        forcedCloseTime: "",
        pickupDate: "",
        triggerWindow: 10,
        extensionDuration: 5,
        extensionType: "ANY_BID",
      });

      fetchRFQs();
    } catch (err) {
      alert(err.response?.data?.message || "Error creating RFQ");
    }
  };

  return (
    <div className="container">

      <div className="header">
        <h2>RFQs</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>

      {role === "BUYER" && (
        <div className="card">
          <h3>Create RFQ</h3>

          <label>RFQ Name</label>
          <input
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <h4>Auction Timeline</h4>

          <label>Start</label>
          <input
            type="datetime-local"
            value={form.bidStartTime}
            onChange={(e) =>
              setForm({ ...form, bidStartTime: e.target.value })
            }
          />

          <label>End</label>
          <input
            type="datetime-local"
            value={form.bidCloseTime}
            onChange={(e) =>
              setForm({ ...form, bidCloseTime: e.target.value })
            }
          />

          <label>Forced Close</label>
          <input
            type="datetime-local"
            value={form.forcedCloseTime}
            onChange={(e) =>
              setForm({ ...form, forcedCloseTime: e.target.value })
            }
          />

          <label>Pickup / Service Date</label>
          <input
            type="datetime-local"
            value={form.pickupDate}
            onChange={(e) =>
              setForm({ ...form, pickupDate: e.target.value })
            }
          />

          <h4>Configuration</h4>

          <label>Trigger Window</label>
          <input
            type="number"
            min="1"
            value={form.triggerWindow}
            onChange={(e) =>
              setForm({
                ...form,
                triggerWindow: Math.max(1, Number(e.target.value) || 1),
              })
            }
          />

          <label>Extension Duration</label>
          <input
            type="number"
            min="1"
            value={form.extensionDuration}
            onChange={(e) =>
              setForm({
                ...form,
                extensionDuration: Math.max(1, Number(e.target.value) || 1),
              })
            }
          />

          <label>Extension Type</label>
          <select
            value={form.extensionType}
            onChange={(e) =>
              setForm({
                ...form,
                extensionType: e.target.value,
              })
            }
          >
            <option value="ANY_BID">Any Bid</option>
            <option value="ANY_RANK_CHANGE">Any Rank Change</option>
            <option value="L1_CHANGE">L1 Change</option>
          </select>

          <button onClick={createRFQ}>Create RFQ</button>
        </div>
      )}

      
      {rfqs?.map((rfq) => {
        const now = new Date();
        const start = new Date(rfq.bidStartTime);
        const close = new Date(rfq.bidCloseTime);
        const forced = new Date(rfq.forcedCloseTime);

        let status = "";
        let className = "";

        if (now < start) {
          status = "Not Started";
          className = "not-started";
        } else if (now >= start && now <= close) {
          status = "Active";
          className = "active";
        } else if (now > close && now < forced) {
          status = "Closed";
          className = "closed";
        } else {
          status = "Force Closed";
          className = "force-closed";
        }

        return (
          <div
            key={rfq.id}
            className="card"
            onClick={() => navigate(`/rfq/${rfq.id}`)}
          >
            <h3>{rfq.name}</h3>

            <p>
              Ends: {new Date(rfq.bidCloseTime).toLocaleString()}
            </p>

            <p>
              Lowest: ₹{rfq.bids?.[0]?.totalAmount || "—"}
            </p>
            <p>
            Forced Close: {new Date(rfq.forcedCloseTime).toLocaleString()}
          </p>

            <p>
              Status:{" "}
              <span className={className} style={{ fontWeight: "bold" }}>
                {status}
              </span>
            </p>
          </div>
        );
      })}
    </div>
  );
}