(function (root, factory) {
  const contracts = factory();
  if (typeof module === "object" && module.exports) module.exports = contracts;
  else root.LongyinContracts = contracts;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  return Object.freeze({
    apiVersion: 1,
    apiPrefix: "/api/v1",
    dataVersion: 1,
    limits: Object.freeze({
      accountNameMin: 2,
      accountNameMax: 32,
      passwordMin: 6,
      penNameMax: 24
    }),
    messages: Object.freeze({
      invalidAccount: "请输入有效的账户（邮箱，或 2-32 位不含空格的用户名）。",
      invalidPassword: "密码至少需要 6 个字符。",
      penNameTooLong: "作者笔名不能超过 24 个字符。",
      penNameNewline: "作者笔名不能包含换行。"
    })
  });
});