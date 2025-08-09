import Vote from "./Vote";

export default function Question({ data, selectedVote, onVoteSelect }) {
  const totalVotes = data.vote_1 + data.vote_2 + data.vote_3;

  function getPercentage(votes) {
    return totalVotes > 0 ? Math.floor((votes / totalVotes) * 100) : 0;
  }

  return (
    <div className="voting-container">
      <h2>{data.text}</h2>
      <div className="poll-options">
        <Vote
          name={data.$id}
          text={data.answer_1}
          percentage={getPercentage(data.vote_1)}
          votes={data.vote_1}
          checked={selectedVote === data.answer_1}
          onChange={() => onVoteSelect(data.answer_1)}
        />
        <Vote
          name={data.$id}
          text={data.answer_2}
          percentage={getPercentage(data.vote_2)}
          votes={data.vote_2}
          checked={selectedVote === data.answer_2}
          onChange={() => onVoteSelect(data.answer_2)}
        />
        <Vote
          name={data.$id}
          text={data.answer_3}
          percentage={getPercentage(data.vote_3)}
          votes={data.vote_3}
          checked={selectedVote === data.answer_3}
          onChange={() => onVoteSelect(data.answer_3)}
        />
        <Vote
          name={data.$id}
          text={data.answer_4}
          percentage={getPercentage(data.vote_4)}
          votes={data.vote_4}
          checked={selectedVote === data.answer_4}
          onChange={() => onVoteSelect(data.answer_4)}
        />
        <Vote
          name={data.$id}
          text={data.answer_5}
          percentage={getPercentage(data.vote_5)}
          votes={data.vote_5}
          checked={selectedVote === data.answer_5}
          onChange={() => onVoteSelect(data.answer_5)}
        />
        <Vote
          name={data.$id}
          text={data.answer_6}
          percentage={getPercentage(data.votes_6)}
          votes={data.votes_6}
          checked={selectedVote === data.answer_6}
          onChange={() => onVoteSelect(data.answer_6)}
        />
        <Vote
          name={data.$id}
          text={data.answer_7}
          percentage={getPercentage(data.vote_7)}
          votes={data.vote_7}
          checked={selectedVote === data.answer_7}
          onChange={() => onVoteSelect(data.answer_7)}
        />
        <Vote
          name={data.$id}
          text={data.answer_8}
          percentage={getPercentage(data.vote_8)}
          votes={data.vote_8}
          checked={selectedVote === data.answer_8}
          onChange={() => onVoteSelect(data.answer_8)}
        />
        <Vote
          name={data.$id}
          text={data.answer_9}
          percentage={getPercentage(data.vote_9)}
          votes={data.vote_9}
          checked={selectedVote === data.answer_9}
          onChange={() => onVoteSelect(data.answer_9)}
        />
        <Vote
          name={data.$id}
          text={data.answer_10}
          percentage={getPercentage(data.vote_10)}
          votes={data.vote_10}
          checked={selectedVote === data.answer_10}
          onChange={() => onVoteSelect(data.answer_10)}
        />
        <Vote
          name={data.$id}
          text={data.answer_11}
          percentage={getPercentage(data.vote_11)}
          votes={data.vote_11}
          checked={selectedVote === data.answer_11}
          onChange={() => onVoteSelect(data.answer_11)}
        />
        <Vote
          name={data.$id}
          text={data.answer_12}
          percentage={getPercentage(data.vote_12)}
          votes={data.vote_12}
          checked={selectedVote === data.answer_12}
          onChange={() => onVoteSelect(data.answer_12)}
        />
        <Vote
          name={data.$id}
          text={data.answer_13}
          percentage={getPercentage(data.vote_13)}
          votes={data.vote_13}
          checked={selectedVote === data.answer_13}
          onChange={() => onVoteSelect(data.answer_13)}
        />
        <Vote
          name={data.$id}
          text={data.answer_14}
          percentage={getPercentage(data.vote_14)}
          votes={data.vote_14}
          checked={selectedVote === data.answer_14}
          onChange={() => onVoteSelect(data.answer_14)}
        />
        <Vote
          name={data.$id}
          text={data.answer_15}
          percentage={getPercentage(data.vote_15)}
          votes={data.vote_15}
          checked={selectedVote === data.answer_15}
          onChange={() => onVoteSelect(data.answer_15)}
        />
      </div>
    </div>
  );
}
