class Type1Event {
  //question: should this be in both publisher and consumer...?
  constructor(data) {
    this.name = "Type1";
    this.data = data;
    this.timestamp = new Date();
  }
}

module.exports = Type1Event;
