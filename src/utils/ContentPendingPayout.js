const moment = require('moment');
const core = require('gls-core-service');
const BlockChainValues = core.utils.BlockChainValues;
const BigNum = core.types.BigNum;

const GOLOS_100_PERCENT = new BigNum(10000);

// Warning: Ported and refactored from blockchain node (C++)
class ContentPendingPayout {
    constructor(contentModel, isPost, { chainProps, gbgRate }) {
        this._contentModel = contentModel;
        this._chainProps = chainProps;
        this._gbgRate = gbgRate;
        this._pot = chainProps.totalRewardFundGolos;
        this._totalR2 = chainProps.totalRewardShares2;
        this._authorTokens = null;
        this._isPost = isPost;
    }

    calc() {
        if (this._totalR2.gt(0)) {
            this._calcPending();
        }

        this._contentModel.payout.date = this._calcPayoutDate();
    }

    _calcPending() {
        const payout = this._calcPayout();
        const crsClaim = this._calcCrsClaim(payout);

        this._authorTokens = payout.minus(crsClaim);

        if (this._contentModel.options.allowCurationRewards) {
            this._appendCurationRewards(crsClaim);
        }

        const benefactorWeights = this._calcBenefactorWeights();

        if (!benefactorWeights.eq(0)) {
            const totalBeneficiary = this._authorTokens
                .times(benefactorWeights)
                .div(GOLOS_100_PERCENT);

            this._authorTokens = this._authorTokens.minus(totalBeneficiary);
            this._appendBenefactorRewards(totalBeneficiary);
        }

        this._appendAuthorRewards({ ...this._calcAuthorRewardsContext() });
    }

    _calcAuthorRewardsContext() {
        const gbg = this._calcGbgForAuthorReward();
        const vestingGolos = this._authorTokens.minus(gbg);
        const toGbg = this._chainProps.gbgPrintRate.times(gbg).div(GOLOS_100_PERCENT);
        const toGolos = gbg.minus(toGbg);

        return { toGolos, toGbg, vestingGolos };
    }

    _calcGbgForAuthorReward() {
        return this._authorTokens
            .times(this._contentModel.options.gbgPercent)
            .div(GOLOS_100_PERCENT.times(2));
    }

    _calcBenefactorWeights() {
        let benefactorWeights = new BigNum(0);

        for (let benefactor of this._contentModel.options.beneficiaries) {
            benefactorWeights = benefactorWeights.plus(benefactor.weight);
        }

        return benefactorWeights;
    }

    _calcPayout() {
        const max = this._contentModel.options.maxAcceptedPayout;
        let payout = this._contentModel.payout.netRshares;
        let rewardWeight;

        if (payout.lt(0)) {
            payout = new BigNum(0);
        }

        if (this._isPost) {
            rewardWeight = this._contentModel.payout.rewardWeight;
        } else {
            rewardWeight = GOLOS_100_PERCENT;
        }

        payout = payout
            .times(rewardWeight)
            .div(GOLOS_100_PERCENT)
            .times(this._pot)
            .div(this._totalR2);

        if (payout.lt(max)) {
            return payout;
        }

        return max;
    }

    _calcCrsClaim(payout) {
        const curationTokens = payout
            .times(this._getCurationRewardsPercent())
            .div(GOLOS_100_PERCENT);
        const crsUnclaimed = this._getCuratorUnclaimedRewards(curationTokens);

        return curationTokens.minus(crsUnclaimed);
    }

    _appendCurationRewards(crsClaim) {
        const gests = BlockChainValues.golosToVests(
            crsClaim.times(this._getVestingSharePrice()),
            this._chainProps
        );

        this._contentModel.payout.pending.curatorValue = this._toGbg(crsClaim);
        this._contentModel.payout.pending.curatorGests = gests;
        this._contentModel.payout.pending.totalValue = (
            this._contentModel.payout.pending.totalValue || new BigNum(0)
        ).plus(this._contentModel.payout.pending.curatorValue);
    }

    _appendBenefactorRewards(totalBeneficiary) {
        const gests = BlockChainValues.golosToVests(
            totalBeneficiary.times(this._getVestingSharePrice()),
            this._chainProps
        );

        this._contentModel.payout.pending.benefactorValue = this._toGbg(totalBeneficiary);
        this._contentModel.payout.pending.benefactorGests = gests;
        this._contentModel.payout.pending.totalValue = (
            this._contentModel.payout.pending.totalValue || new BigNum(0)
        ).plus(this._contentModel.payout.pending.benefactorValue);
    }

    _appendAuthorRewards({ toGolos, toGbg, vestingGolos }) {
        this._contentModel.payout.pending.authorGolos = toGolos;
        this._contentModel.payout.pending.authorGbg = this._toGbg(toGbg);
        this._contentModel.payout.pending.authorValue = this._contentModel.payout.pending.authorGbg.plus(
            this._toGbg(toGolos.plus(vestingGolos))
        );

        this._contentModel.payout.pending.authorGests = BlockChainValues.golosToVests(
            vestingGolos.times(this._getVestingSharePrice()),
            this._chainProps
        );
        this._contentModel.payout.pending.totalValue = (
            this._contentModel.payout.pending.totalValue || new BigNum(0)
        ).plus(this._contentModel.payout.pending.authorValue);
    }

    _getCurationRewardsPercent() {
        return GOLOS_100_PERCENT.div(100).times(25);
    }

    _getVestingSharePrice() {
        const fund = this._chainProps.totalVestingFundGolos;
        const shares = this._chainProps.totalVestingShares;

        if (fund.eq(0) || shares.eq(0)) {
            return new BigNum(1);
        }

        return BlockChainValues.vestsToGolos(shares, this._chainProps).div(fund);
    }

    _toGbg(value) {
        return value.times(this._gbgRate);
    }

    _calcPayoutDate() {
        const timestamp =
            +moment(this._contentModel.createdInBlockchain).utc() + 60 * 60 * 24 * 7 * 1000;

        return moment(timestamp).format('YYYY-MM-DDTHH:mm:ss');
    }

    _getCuratorUnclaimedRewards(curationTokens) {
        const totalVoteWeight = this._contentModel.vote.totalWeight;
        const totalVoteRealWeight = this._contentModel.vote.totalRealWeight;

        if (totalVoteWeight.eq(0)) {
            return new BigNum(0);
        }

        return curationTokens
            .times(totalVoteWeight.minus(totalVoteRealWeight))
            .div(totalVoteWeight);
    }
}

module.exports = ContentPendingPayout;
