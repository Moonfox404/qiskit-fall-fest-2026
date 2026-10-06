from pydantic import BaseModel


class EvaluationResult(BaseModel):
    """
    The evaluation result of the quantum circuit simulation.
    """
    fidelity: float
    kl_divergence: float
    total_variation_distance: float