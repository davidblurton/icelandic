let convert = (row, raw) => {
  return {
    _id: raw,
    _url: `/api/${raw}/id`,
    headWord: row[0],
    bilId: row[1],
    wordClass: row[2],
    section: row[3],
    wordForm: row[4],
    grammarTag: row[5]
  }
}

module.exports = function(data) {
  var word = data.split('~')[1];
  var row = word.split(';');
  return convert(row, data);
}
