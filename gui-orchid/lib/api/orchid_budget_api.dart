import 'package:orchid/util/units.dart';

import 'orchid_crypto.dart';

// Funds and Budgeting API
class OrchidBudgetAPI {
  static OrchidBudgetAPI _shared = OrchidBudgetAPI._init();

  OrchidBudgetAPI._init();

  factory OrchidBudgetAPI() {
    return _shared;
  }

  void applicationReady() async {}
}

/// Lottery pot balance and deposit amounts.
class LotteryPot {
  final OXT deposit;
  final OXT balance;
  final BigInt unlock;
  final EthereumAddress verifier;

  LotteryPot({
    this.deposit,
    this.balance,
    this.unlock,
    this.verifier,
  });

  OXT get maxTicketFaceValue {
    return maxTicketFaceValueFor(balance, deposit);
  }

  static OXT maxTicketFaceValueFor(OXT balance, OXT deposit) {
    return OXT.min(balance, deposit / 2.0);
  }
}

// TODO: Placeholder budget api
/// A budget representing a deposit, spend rate, and term.
class Budget {
  OXT deposit;
  OXT spendRate; // OXT per Month
  Months term;

  Budget({this.deposit, this.spendRate, this.term});

  Budget.fromJson(Map<String, dynamic> json)
      : deposit = OXT(json['deposit']),
        spendRate = OXT(json['spendRate']),
        term = Months(json['term']);

  Map<String, dynamic> toJson() => {
        'deposit': deposit.value,
        'spendRate': spendRate.value,
        'term': term.value
      };

  bool operator ==(o) =>
      o is Budget &&
      o.deposit == deposit &&
      o.spendRate == spendRate &&
      o.term == term;

// todo: hash
}

// TODO: Placeholder budget api
/// A set of recommended budgets including low, average, and high usage scenarios
/// as well as a custom budget recommendation based on the user's history.
class BudgetRecommendation {
  final Budget lowUsage;
  final Budget averageUsage;
  final Budget highUsage;
  final Budget recommended;

  const BudgetRecommendation(
      {this.lowUsage, this.averageUsage, this.highUsage, this.recommended});
}
