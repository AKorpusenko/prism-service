const REVERSE_AUCTION_WINDOW_SECONDS = 60 * 30;
const VOTE_REGENERATION_SECONDS = 5 * 60 * 60 * 24;
const GOLOS_100_PERCENT = 10000;

class VotePendingPayout {
    constructor({ voteModel, contentModel, userModel }, chainProps) {
        this._voteModel = voteModel;
        this._contentModel = voteModel;
        this._userModel = userModel;
        this._voteRegenerationPerDay = chainProps.vote_regeneration_per_day;
    }

    do_apply() {
        const comment_vote_idx = _db
            .get_index /*comment_vote_index*/
            ()
            .indices()
            .get /*by_comment_voter*/
            ();
        const itr = comment_vote_idx.find(
            std__make_tuple(this._contentModel.id, this._userModel.id)
        );
        const elapsed_seconds = (
            _db.head_block_time() - this._userModel.last_vote_time
        ).to_seconds();
        const regenerated_power = (GOLOS_100_PERCENT * elapsed_seconds) / VOTE_REGENERATION_SECONDS;
        const current_power = Math.min(
            this._userModel.voting_power + regenerated_power,
            GOLOS_100_PERCENT
        );

        const abs_weight = Math.abs(this._voteModel.weight);
        let used_power = (current_power * abs_weight) / GOLOS_100_PERCENT;

        const max_vote_denom =
            (this._voteRegenerationPerDay * VOTE_REGENERATION_SECONDS) / (60 * 60 * 24);

        used_power = (used_power + max_vote_denom - 1) / max_vote_denom;

        const abs_rshares =
            (this._userModel.effective_vesting_shares().amount * used_power) / GOLOS_100_PERCENT;

        if (itr === comment_vote_idx.end()) {
            const rshares = this._voteModel.weight < 0 ? -abs_rshares : abs_rshares;

            this._userModel.voting_power = current_power - used_power;
            this._userModel.last_vote_time = _db.head_block_time();

            const old_vote_rshares = this._contentModel.vote_rshares;

            _db.modify(this._contentModel, comment_object => {
                comment_object.net_rshares += rshares;
            });

            let max_vote_weight = 0;

            _db.create(comment_vote_object => {
                comment_vote_object.comment = this._contentModel.id;
                comment_vote_object.rshares = rshares;
                comment_vote_object.vote_percent = this._voteModel.weight;
                comment_vote_object.last_update = _db.head_block_time();

                if (
                    rshares > 0 &&
                    this._contentModel.last_payout === fc__time_point_sec() &&
                    this._contentModel.allow_curation_rewards
                ) {
                    const old_weight =
                        /*uint64_t*/ (std__numeric_limits__max() *
                            fc__uint128_t(old_vote_rshares.value)) /
                        (2 * _db.get_content_constant_s() + old_vote_rshares.value);
                    const new_weight =
                        /*uint64_t*/ (std__numeric_limits__max() *
                            fc__uint128_t(this._contentModel.vote_rshares)) /
                        (2 * _db.get_content_constant_s() + this._contentModel.vote_rshares);
                    comment_vote_object.weight = new_weight - old_weight;

                    max_vote_weight = comment_vote_object.weight;

                    const filteredAuctionWindow = Math.min(
                        (comment_vote_object.last_update - this._contentModel.created).to_seconds(),
                        REVERSE_AUCTION_WINDOW_SECONDS
                    );

                    comment_vote_object.weight =
                        (max_vote_weight * filteredAuctionWindow) / REVERSE_AUCTION_WINDOW_SECONDS;
                } else {
                    comment_vote_object.weight = 0;
                }
            });

            if (max_vote_weight) {
                _db.modify(this._contentModel, comment_object => {
                    comment_object.total_vote_weight += max_vote_weight;
                });
            }
        } else {
            const rshares = this._voteModel.weight < 0 ? -abs_rshares : abs_rshares;

            this._userModel.voting_power = current_power - used_power;
            this._userModel.last_vote_time = _db.head_block_time();
            this._contentModel.net_rshares -= itr.rshares;
            this._contentModel.net_rshares += rshares;
            this._contentModel.total_vote_weight -= itr.weight;

            _db.modify(itr, comment_vote_object => {
                comment_vote_object.rshares = rshares;
                comment_vote_object.vote_percent = this._voteModel.weight;
                comment_vote_object.last_update = _db.head_block_time();
                comment_vote_object.weight = 0;
            });
        }
    }
}

module.exports = VotePendingPayout;
