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
      </div>
    </div>
  );
}
