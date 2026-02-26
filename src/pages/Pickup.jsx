function Pickup() {
  return (
    <div>
      <h2>Schedule Waste Pickup</h2>
      <form>
        <input type="text" placeholder="Your Address" /><br />
        <input type="date" /><br />
        <button type="submit">Schedule</button>
      </form>
    </div>
  );
}

export default Pickup;
