module.exports = {
  getIndexForMELVV1: function (montype) {
    switch (montype) {
      case "0100":
        return "level";
      case "0200":
        return "velocity";
      case "0300":
        return "quantity";
      case "0400":
        return "reversequantity";
      case "0500":
        return "temperature";
      case "0600":
        return "humidity";
      default:
        return "na";
    }
  }
}