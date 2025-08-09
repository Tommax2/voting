import Vote from "./Vote";

export default function Question({ data, selectedVote, onVoteSelect }) {
  const totalVotes = data.votes_1 + data.votes_2 + data.votes_3;

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
          percentage={getPercentage(data.votes_1)}
          votes={data.votes_1}
          checked={selectedVote === data.answer_1}
          onChange={() => onVoteSelect(data.answer_1)}
        />
        <Vote
          name={data.$id}
          text={data.answer_2}
          percentage={getPercentage(data.votes_2)}
          votes={data.votes_2}
          checked={selectedVote === data.answer_2}
          onChange={() => onVoteSelect(data.answer_2)}
        />
        <Vote
          name={data.$id}
          text={data.answer_3}
          percentage={getPercentage(data.votes_3)}
          votes={data.votes_3}
          checked={selectedVote === data.answer_3}
          onChange={() => onVoteSelect(data.answer_3)}
        />
        <Vote
          name={data.$id}
          text={data.answer_4}
          percentage={getPercentage(data.votes_4)}
          votes={data.votes_4}
          checked={selectedVote === data.answer_4}
          onChange={() => onVoteSelect(data.answer_4)}
        />
        <Vote
          name={data.$id}
          text={data.answer_5}
          percentage={getPercentage(data.votes_5)}
          votes={data.votes_5}
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
          percentage={getPercentage(data.votes_7)}
          votes={data.votes_7}
          checked={selectedVote === data.answer_7}
          onChange={() => onVoteSelect(data.answer_7)}
        />
        <Vote
          name={data.$id}
          text={data.answer_8}
          percentage={getPercentage(data.votes_8)}
          votes={data.votes_8}
          checked={selectedVote === data.answer_8}
          onChange={() => onVoteSelect(data.answer_8)}
        />
        <Vote
          name={data.$id}
          text={data.answer_9}
          percentage={getPercentage(data.votes_9)}
          votes={data.votes_9}
          checked={selectedVote === data.answer_9}
          onChange={() => onVoteSelect(data.answer_9)}
        />
        <Vote
          name={data.$id}
          text={data.answer_10}
          percentage={getPercentage(data.votes_10)}
          votes={data.votes_10}
          checked={selectedVote === data.answer_10}
          onChange={() => onVoteSelect(data.answer_10)}
        />
        <Vote
          name={data.$id}
          text={data.answer_11}
          percentage={getPercentage(data.votes_11)}
          votes={data.votes_11}
          checked={selectedVote === data.answer_11}
          onChange={() => onVoteSelect(data.answer_11)}
        />
        <Vote
          name={data.$id}
          text={data.answer_12}
          percentage={getPercentage(data.votes_12)}
          votes={data.votes_12}
          checked={selectedVote === data.answer_12}
          onChange={() => onVoteSelect(data.answer_12)}
        />
        <Vote
          name={data.$id}
          text={data.answer_13}
          percentage={getPercentage(data.votes_13)}
          votes={data.votes_13}
          checked={selectedVote === data.answer_13}
          onChange={() => onVoteSelect(data.answer_13)}
        />
        <Vote
          name={data.$id}
          text={data.answer_14}
          percentage={getPercentage(data.votes_14)}
          votes={data.votes_14}
          checked={selectedVote === data.answer_14}
          onChange={() => onVoteSelect(data.answer_14)}
        />
        <Vote
          name={data.$id}
          text={data.answer_15}
          percentage={getPercentage(data.votes_15)}
          votes={data.votes_15}
          checked={selectedVote === data.answer_15}
          onChange={() => onVoteSelect(data.answer_15)}
        />
      </div>
    </div>
  );
}
