const addImeiToList = async (imei) => {
    try {
      const newImei = new ImeiList({ imei });
      await newImei.save();
      console.log(`Added new IMEI to the list: ${imei}`);
    } catch (error) {
      console.error('Error adding IMEI to the list:', error.message);
    }
  };
  module.exports = { addImeiToList };